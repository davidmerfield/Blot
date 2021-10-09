const client = require("client");
const config = require("config");
const google = require("googleapis").google;
const fs = require("fs-extra");
const clfdate = require("helper/clfdate");
const localPath = require("helper/localPath");
const database = require("../database");
const disconnect = require("../disconnect");
const verify = require("../util/verify");
const createDriveClient = require("../util/createDriveClient");
const setupWebhook = require("../util/setupWebhook");
const sse = require("../util/sse");
const express = require("express");
const dashboard = new express.Router();

const VIEWS = require("path").resolve(__dirname + "/../views") + "/";

const SETUP_CHANNEL = (req) =>
	"blog:" + req.blog.id + ":client:google-drive:set-up-folder";

const REDIRECT_URL = config.webhook_forwarding_host
	? `https://${config.webhook_forwarding_host}/clients/google-drive/authenticate`
	: `https://${config.host}/settings/client/google-drive/authenticate`;

dashboard.use(async function (req, res, next) {
	const account = await database.getAccount(req.blog.id);
	if (!account) return next();

	if (
		account.settingUp &&
		req.originalUrl.indexOf(req.baseUrl + "/set-up-folder") !== 0
	) {
		console.log("req.originalUrl", req.originalUrl);
		return res.redirect(req.baseUrl + "/set-up-folder");
	}

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

dashboard.use("/set-up-folder", function (req, res, next) {
	fs.readdir(localPath(req.blog.id, "/"), function (err, contents) {
		if (err) return next(err);
		res.locals.emptyFolder = req.emptyFolder = contents.length === 0;
		res.locals.nameOfFolderToCreate = req.blog.title.split("/").join("").trim();
		next();
	});
});

dashboard
	.route("/set-up-folder")
	.get(function (req, res) {
		if (!res.locals.account.settingUp && res.locals.account.folderId)
			return res.message(
				req.baseUrl,
				"Successfully set up your folder on Google Drive"
			);

		res.render(VIEWS + "set-up-folder");
	})
	.post(async function (req, res) {
		await database.setAccount(req.blog.id, { settingUp: true });

		if (res.locals.emptyFolder) {
			await setUpBlogFolder(req.blog, res.locals.emptyFolder);
		} else {
			setUpBlogFolder(req.blog, res.locals.emptyFolder);
		}

		res.redirect(req.baseUrl + "/set-up-folder");
	});

dashboard
	.route("/set-up-folder/cancel")
	.all(function (req, res, next) {
		if (!res.locals.account.settingUp) return res.redirect(req.baseUrl);
		next();
	})
	.get(function (req, res) {
		res.render(VIEWS + "set-up-folder-cancel");
	})
	.post(async function (req, res) {
		await database.setAccount(req.blog.id, {
			error: null,
			channel: null,
			folderId: null,
			folderPath: null,
			settingUp: null,
		});
		res.message(req.baseUrl, "Cancelled the creation of your new folder");
	});

dashboard.get("/set-up-folder/progress", sse(SETUP_CHANNEL));

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

		if (!account.folderId)
			return res.message(
				req.baseUrl + "/set-up-folder",
				"Blot now has access to your Google Drive"
			);

		res.message(req.baseUrl, "Re-connected to Google Drive");

		try {
			await verify(req.blog.id);
			await setupWebhook(req.blog.id);
		} catch (e) {
			await database.setAccount(req.blog.id, {
				error: "Could not set up webhooks",
				channel: null,
				folderId: null,
				folderPath: null,
			});
		}
	});
});

const setUpBlogFolder = async function (blog, emptyFolder) {
	try {
		const checkWeCanContinue = async () => {
			const { settingUp } = await database.getAccount(blog.id);
			if (!settingUp) throw new Error("Permission to set up revoked");
		};

		const publish = (...args) => {
			const message = args.join(" ");
			client.publish(SETUP_CHANNEL({ blog: { id: blog.id } }), message);
			console.log(clfdate(), "Google Drive Client", message);
		};

		publish("Establishing connection to Google Drive");
		const { drive } = await createDriveClient(blog.id);

		var fileMetadata = {
			name: blog.title.split("/").join("").trim(),
			mimeType: "application/vnd.google-apps.folder",
		};

		await checkWeCanContinue();
		publish("Creating new folder");
		const folder = await drive.files.create({
			resource: fileMetadata,
			fields: "id, name",
		});

		const folderId = folder.data.id;
		const folderPath = "/My Drive/" + folder.data.name;

		await database.setAccount(blog.id, {
			folderId: folderId,
			folderPath: folderPath,
		});

		if (!emptyFolder) {
			await verify(blog.id, publish);
		}

		await checkWeCanContinue();
		publish("Setting up webhook");
		await setupWebhook(blog.id);

		await database.setAccount(blog.id, { settingUp: null });
		publish("All files transferred");
	} catch (e) {
		console.log(clfdate(), "Google Drive Client", e);

		let error = "Failed to set up account";

		if ((e.message = "Permission to set up revoked")) {
			error = null;
		}

		await database.setAccount(blog.id, {
			error,
			settingUp: null,
			channel: null,
			folderId: null,
			folderPath: null,
		});
	}
};

module.exports = dashboard;
