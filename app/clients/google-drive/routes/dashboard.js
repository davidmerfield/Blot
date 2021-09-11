const config = require("config");
const express = require("express");
const dashboard = new express.Router();
const google = require("googleapis").google;
const database = require("../database");
const client = require("../util/client");
const disconnect = require("../disconnect");
const VIEWS = require("path").resolve(__dirname + "/../views") + "/";

const REDIRECT_URL =
	config.environment === "development"
		? "http://localhost:8822/settings/client/google-drive/authenticate"
		: "https://" + config.host + "/settings/client/google-drive/authenticate";

// 'online' (default) or 'offline' (gets refresh_token)
// which I believe we'll need to interact with user's
// drive over a long period of time.
const AUTH_URL_CONFIG = {
	access_type: "offline",
	scope: ["https://www.googleapis.com/auth/drive"],
};

dashboard.use(function loadGoogleDriveAccount(req, res, next) {
	database.getAccount(req.blog.id, function (err, account) {
		if (err) return next(err);
		if (account) {
			res.locals.account = account;
		}
		next();
	});
});

dashboard.get("/", function (req, res) {
	res.render(VIEWS + "index");
});

dashboard
	.route("/sync")
	.get(function (req, res) {
		res.render(VIEWS + "sync");
	})
	.post(function (req, res, next) {
		require("../sync")(req.blog.id, function (err) {
			if (err) return next(err);
			res.message("/settings/client/google-drive", "Success!");
		});
	});

dashboard
	.route("/create-folder")
	.get(function (req, res) {
		res.render(VIEWS + "create-folder");
	})
	.post(function (req, res, next) {
		if (res.locals.account.folderID) return next();

		client(req.blog.id, async function (err, drive) {
			if (err) return next(err);

			var fileMetadata = {
				name: req.blog.title,
				mimeType: "application/vnd.google-apps.folder",
			};

			let folderID, folderName;
			try {
				const folder = await drive.files.create({
					resource: fileMetadata,
					fields: "id, name",
				});

				console.log(folder);

				folderID = folder.data.id;
				folderName = folder.data.name;
			} catch (e) {
				return next(e);
			}

			console.log("here", folderName, folderID);
			database.setAccount(req.blog.id, { folderID, folderName }, function (
				err
			) {
				if (err) return next(err);
				res.redirect("/settings/client/google-drive");
			});
		});
	});

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
	oauth2Client.getToken(req.query.code, function (err, account) {
		if (err) return next(err);
		database.setAccount(req.blog.id, account, function (err) {
			if (err) return next(err);
			client(req.blog.id, function (err, drive) {
				if (err) return next(err);
				drive.about.get({ fields: "*" }, function (err, response) {
					if (err) return next(err);
					let email = response.data.user.emailAddress;
					database.setAccount(req.blog.id, { email }, function (err) {
						if (err) return next(err);
						res.redirect("/settings/client/google-drive/create-folder");
					});
				});
			});
		});
	});
});

dashboard.get("/list", function (req, res, next) {
	client(req.blog.id, function (err, drive) {
		if (err) return next(err);
		drive.files.list(
			{
				pageSize: 10,
				fields: "nextPageToken, files(id, name)",
			},
			(err, response) => {
				if (err) return next(err);
				res.locals.files = response.data.files;
				res.render(VIEWS + "list");
			}
		);
	});
});

dashboard.use(function(err, req, res, next){
	res.send(err);
})

module.exports = dashboard;
