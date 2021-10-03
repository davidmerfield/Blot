const config = require("config");
const express = require("express");
const dashboard = new express.Router();
const google = require("googleapis").google;
const database = require("../database");
const createDriveClient = require("../util/createDriveClient");
const disconnect = require("../disconnect");
const VIEWS = require("path").resolve(__dirname + "/../views") + "/";
const fs = require("fs-extra");
const localPath = require("helper/localPath");
const client = require("client");
const setupWebhook = require("../util/setupWebhook");
const sse = require("../util/sse");

const SETUP_CHANNEL = (req) =>
	"blog:" + req.blog.id + ":client:google-drive:set-up-folder";

const REDIRECT_URL = config.webhook_forwarding_host
	? `https://${config.webhook_forwarding_host}/clients/google-drive/authenticate`
	: `https://${config.host}/settings/client/google-drive/authenticate`;

dashboard.use(async function (req, res, next) {
	const account = await database.getAccount(req.blog.id);
	if (!account) return next();
	if (account.folderPath)
		account.folderParents = account.folderPath
			.split("/")
			.slice(1)
			.map((name, i, arr) => {
				return { name, last: arr.length - 1 === i };
			});

	res.locals.account = account;
	next();
});

dashboard.get("/", function (req, res) {
	res.render(VIEWS + "index");
});

dashboard
	.route("/set-up-folder")

	.all(function (req, res, next) {
		if (res.locals.account.folderID) return res.redirect(req.baseUrl);

		fs.readdir(localPath(req.blog.id, "/"), function (err, contents) {
			if (err) return next(err);
			res.locals.emptyFolder = req.emptyFolder = contents.length === 0;
			next();
		});
	})
	.get(function (req, res) {
		res.locals.nameOfFolderToCreate = req.blog.title.split("/").join("").trim();
		res.render(VIEWS + "set-up-folder");
	})
	.post(
		async function (req, res, next) {
			const { drive } = await createDriveClient(req.blog.id);
			req.drive = drive;
			next();
		},

		async function createBlogFolder(req, res, next) {
			var fileMetadata = {
				name: req.blog.title.split("/").join("").trim(),
				mimeType: "application/vnd.google-apps.folder",
			};

			try {
				const folder = await req.drive.files.create({
					resource: fileMetadata,
					fields: "id, name",
				});

				const db = database.folder(folder.data.id);
				const { data } = await req.drive.changes.getStartPageToken({
					// Whether the user is acknowledging the risk of downloading known malware or other abusive files.
					// The ID for the file in question.
					supportsAllDrives: true,
					includeDeleted: true,
					includeCorpusRemovals: true,
					includeItemsFromAllDrives: true,
				});

				// Store blog folder
				await db.set(folder.data.id, "/");
				await db.setPageToken(data.startPageToken);

				req.folderID = folder.data.id;
				req.folderName = folder.data.name;
				req.folderPath = "/My Drive/" + req.folderName;
				await database.setAccount(req.blog.id, {
					folderID: req.folderID,
					folderName: req.folderName,
					folderPath: req.folderPath,
				});
			} catch (e) {
				return next(e);
			}

			next();
		},

		async function transferExistingFiles(req, res, next) {
			if (req.emptyFolder) return next();

			try {
				await writeContentsOfFolder(req.blog.id);
			} catch (e) {
				if (e.code === 401) {
					// take a look at the scopes originally provisioned for the access token
					await database.setAccount(req.blog.id, {
						error: "Not full permission",
						folderID: null,
						folderName: null,
						folderPath: null,
					});
				}
				return res.message(req.baseUrl, e);
			}

			next();
		},

		async function (req, res, next) {
			try {
				await setupWebhook(req.blog.id);
			} catch (e) {
				await database.setAccount(req.blog.id, {
					error: "Could not set up webhooks",
					channel: null,
					folderID: null,
					folderName: null,
					folderPath: null,
				});

				console.log(e);
				return next(e);
			}
			next();
		},

		function (req, res) {
			res.message(req.baseUrl, "Your folder is now set up on Google Drive");
		}
	);

dashboard.get("/set-up-folder/status", sse(SETUP_CHANNEL));

dashboard
	.route("/disconnect")
	.get(function (req, res) {
		res.render(VIEWS + "disconnect");
	})
	.post(function (req, res, next) {
		disconnect(req.blog.id, next);
	});

dashboard.get("/redirect", function (req, res) {
	const oauth2Client = new google.auth.OAuth2(
		config.google.drive.key,
		config.google.drive.secret,
		REDIRECT_URL
	);

	res.redirect(
		oauth2Client.generateAuthUrl({
			access_type: "offline",
			scope: "https://www.googleapis.com/auth/drive",
		})
	);
});

dashboard.get("/authenticate", function (req, res, next) {
	if (!req.query.code) {
		return res.message(
			req.baseUrl,
			new Error("Please authorize Blot to access your Google Drive")
		);
	}
	const oauth2Client = new google.auth.OAuth2(
		config.google.drive.key,
		config.google.drive.secret,
		REDIRECT_URL
	);

	// This will provide an object with the access_token and refresh_token.
	// Save these somewhere safe so they can be used at a later time.
	oauth2Client.getToken(req.query.code, async function (err, credentials) {
		if (err) {
			return res.message(req.baseUrl, err);
		}

		const { refresh_token, access_token, expiry_date } = credentials;

		if (!refresh_token) {
			return res.message(
				req.baseUrl,
				new Error(
					"Missing refresh_token from Google Drive. This probably happened because you had previously connected Blot with Google Drive. Please remove Blot on your Google Account permissions page."
				)
			);
		}

		await database.setAccount(req.blog.id, {
			refresh_token,
			access_token,
			expiry_date,
		});

		try {
			const { drive } = await createDriveClient(req.blog.id);
			let email;
			const response = await drive.about.get({ fields: "*" });
			email = response.data.user.emailAddress;

			// If we are re-authenticating because of an error
			// then remove the error message!
			await database.setAccount(req.blog.id, { email, error: "" });
		} catch (e) {
			console.log("Error getting info");
			await database.setAccount(req.blog.id, { error: e.message });
			return res.redirect(req.baseUrl);
		}

		const account = await database.getAccount(req.blog.id);

		if (!account.folderID)
			return res.message(
				req.baseUrl + "/set-up-folder",
				"Blot now has access to your Google Drive"
			);

		try {
			await setupWebhook(req.blog.id);
		} catch (e) {
			await database.setAccount(req.blog.id, {
				error: "Could not set up webhooks",
				channel: null,
				folderID: null,
				folderName: null,
				folderPath: null,
			});

			console.log(e);
			return next(e);
		}
		return res.message(req.baseUrl, "Re-connected to Google Drive");
	});
});

const join = require("path").join;
const { promisify } = require("util");
const write = promisify(require("../write"));

const writeContentsOfFolder = async (blogID) => {
	const path = localPath(blogID, "/");
	const relative = (fullPath) => fullPath.slice(path.length);
	const publish = (message) => {
		client.publish(SETUP_CHANNEL({ blog: { id: blogID } }), message);
		console.log(message);
	};

	publish("Looking for files to transfer");

	const walk = async (dir) => {
		const contents = await fs.readdir(dir);

		for (const item of contents) {
			const path = join(dir, item);
			const stat = await fs.stat(path);
			if (stat.isDirectory()) {
				await walk(path);
			} else {
				publish("Transferring " + relative(path));
				await write(blogID, relative(path), fs.createReadStream(path));
			}
		}
	};

	await walk(path);
};

module.exports = dashboard;
