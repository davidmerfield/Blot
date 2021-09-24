const config = require("config");
const express = require("express");
const dashboard = new express.Router();
const google = require("googleapis").google;
const database = require("../database");
const createDriveClient = require("../util/createDriveClient");
const disconnect = require("../disconnect");
const VIEWS = require("path").resolve(__dirname + "/../views") + "/";
const sync = require("../sync");
const fs = require("fs-extra");
const localPath = require("helper/localPath");
const redis = require("redis");
const client = require("client");

const REDIRECT_URL =
	config.environment === "development"
		? "http://localhost:8822/settings/client/google-drive/authenticate"
		: "https://" + config.host + "/settings/client/google-drive/authenticate";

// 'online' (default) or 'offline' (gets refresh_token)
// which I believe we'll need to interact with user's
// drive over a long period of time.
const AUTH_URL_CONFIG = {
	access_type: "offline",
	scope: [
		"https://www.googleapis.com/auth/drive",
		"https://www.googleapis.com/auth/drive.activity",
	],
};

dashboard.use(async function loadGoogleDriveAccount(req, res, next) {
	const account = await database.getAccount(req.blog.id);
	if (account) {
		res.locals.account = account;

		if (account.folderPath)
			res.locals.account.folderParents = account.folderPath
				.split("/")
				.slice(1)
				.map((name, i, arr) => {
					return { name, last: arr.length - 1 === i };
				});
	}
	next();
});

dashboard.get("/", function (req, res) {
	res.render(VIEWS + "index");
});

dashboard
	.route("/webhook")
	.get(function (req, res) {
		res.render(VIEWS + "sync");
	})
	.post(function (req, res, next) {
		sync(req.blog.id, { fromScratch: req.query.fromScratch }, function (err) {
			if (err) return next(err);
			res.message("/settings/client/google-drive", "Success!");
		});
	});

dashboard.route("/set-up-folder/status").get(function (req, res) {
	var blogID = req.blog.id;
	var client = redis.createClient();

	req.socket.setTimeout(2147483647);

	res.writeHead(200, {
		// This header tells NGINX to NOT
		// buffer the response. Otherwise
		// the messages don't make it to the client.
		// A similar problem to the one caused
		// by the compression middleware a few lines down.
		"X-Accel-Buffering": "no",
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		"Connection": "keep-alive",
	});

	res.write("\n");

	var channel = "blog:" + blogID + ":client:google-drive:set-up-folder";

	client.subscribe(channel);

	client.on("message", function (_channel, message) {
		if (_channel !== channel) return;

		res.write("\n");
		res.write("data: " + message + "\n\n");
		res.flush();
	});

	client.on("error", function (err) {
		console.error("Error for Google Drive Client:/set-up-folder/status:");
		console.error(err);
		res.socket.destroy();
	});

	req.on("close", function () {
		client.unsubscribe();
		client.quit();
	});
});

dashboard
	.route("/set-up-folder")

	.all(function (req, res, next) {
		if (res.locals.account.folderID)
			return res.redirect("/settings/client/google-drive");

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
		function createDriveClient(req, res, next) {
			createDriveClient(req.blog.id, function (err, drive) {
				if (err) return next(err);
				req.drive = drive;
				next();
			});
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

		function transferExistingFiles(req, res, next) {
			if (req.emptyFolder) return next();
			writeContentsOfFolder(req.blog.id, next);
		},

		function (req, res) {
			// TODO we will also set up the streaming notifications
			// here with the webhook service offered by Google Drive
			res.message(
				"/settings/client/google-drive",
				"Your folder is now set up on Google Drive"
			);
		}
	);

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

	res.redirect(oauth2Client.generateAuthUrl(AUTH_URL_CONFIG));
});

dashboard.get("/authenticate", function (req, res, next) {
	const oauth2Client = new google.auth.OAuth2(
		config.google.drive.key,
		config.google.drive.secret,
		REDIRECT_URL
	);

	// This will provide an object with the access_token and refresh_token.
	// Save these somewhere safe so they can be used at a later time.
	oauth2Client.getToken(req.query.code, async function (err, account) {
		if (err) return next(err);
		await database.setAccount(req.blog.id, account);
		createDriveClient(req.blog.id, function (err, drive) {
			if (err) return next(err);
			drive.about.get({ fields: "*" }, async function (err, response) {
				if (err) return next(err);
				let email = response.data.user.emailAddress;
				// If we are re-authenticating because of an error
				// then remove the error message!
				await database.setAccount(req.blog.id, { email, error: "" });

				res.message(
					"/settings/client/google-drive/set-up-folder",
					"You have connected Blot to Google Drive successfully"
				);
			});
		});
	});
});

dashboard.use(function (err, req, res, next) {
	res.send(err);
});

const join = require("path").join;
const { promisify } = require("util");
const write = promisify(require("../write"));

const writeContentsOfFolder = async (blogID, done) => {
	const path = localPath(blogID, "/");
	const channel = "blog:" + blogID + ":client:google-drive:set-up-folder";

	const relative = (fullPath) => fullPath.slice(path.length);

	const publish = (message) => {
		client.publish(channel, message);
		console.log(message);
	};

	publish("starting sync");

	const walk = async (dir) => {
		publish(channel, "Walking " + relative(dir));
		const contents = await fs.readdir(dir);

		if (!contents.length) {
			// TODO we need to mkdir on Google Drive
			// for empty folder
		}

		for (const item of contents) {
			const path = join(dir, item);
			const stat = await fs.stat(path);
			publish("Checking " + relative(path));
			if (stat.isDirectory()) {
				await walk(path);
			} else {
				publish("Writing " + relative(path));
				const contents = await fs.readFile(path);

				publish(
					"Writing " +
						contents.toString().slice(0, 100) +
						"... to " +
						relative(path)
				);
				await write(blogID, relative(path), contents);
			}
		}
	};

	await walk(path);

	// const interval = setInterval(function () {
	// 	client.publish(channel, "Syncing " + Date.now() + ".txt");
	// }, 300);

	setTimeout(function () {
		done();
	}, 1000);
};

module.exports = dashboard;
