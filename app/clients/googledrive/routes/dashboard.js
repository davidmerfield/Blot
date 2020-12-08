// https://developers.google.com/drive/api/v3/quickstart/nodejs

const { google } = require("googleapis");

const REDIRECT_URL = "http://localhost:8822/clients/googledrive/authenticate";

let creds;

const SCOPE = ["https://www.googleapis.com/auth/drive"];

const NO_ACCOUNT_ERROR =
	"Google Drive client: Error no account in database for blog: ";
const INVALID_ACCOUNT_STRING =
	"Google Drive client: Error decoding JSON for account of blog ";

const client = require("client");

const database = {
	accountKey: function (blogID) {
		return "blog:" + blogID + ":googledrive:account";
	},
	getAccount: function (blogID, callback) {
		const key = this.accountKey(blogID);

		client.get(key, function (err, account) {
			if (err) {
				return callback(err);
			}

			if (!account) {
				return callback(new Error(NO_ACCOUNT_ERROR + blogID));
			}

			try {
				account = JSON.parse(account);
			} catch (e) {
				return callback(new Error(INVALID_ACCOUNT_STRING + blogID));
			}

			callback(null, account);
		});
	},
	setAccount: function (blogID, changes, callback) {
		const key = this.accountKey(blogID);

		this.getAccount(blogID, function (err, account) {
			// we don't care if the account doesn't exist
			// if (err) return callback(err);

			account = account || {};

			for (var i in changes) {
				account[i] = changes[i];
			}

			client.set(key, JSON.stringify(account), callback);
		});
	},
};

database.setAccount("123", { foo: "bar" }, function (err) {
	if (err) throw err;
	database.getAccount("123", function (err, account) {
		if (err) throw err;
		console.log("got account", account);
	});
});

// Express web server
const express = require("express");

const dashboard = new express.Router();

dashboard.get("/", function (req, res) {
	res.redirect(req.path + "setup");
});

dashboard.get("/setup", function (req, res) {
	res.render("setup");
});

dashboard.get("/redirect", function (req, res) {
	const oauth2Client = new google.auth.OAuth2(
		process.env.BLOT_GOOGLEDRIVE_ID,
		process.env.BLOT_GOOGLEDRIVE_SECRET,
		REDIRECT_URL
	);

	// 'online' (default) or 'offline' (gets refresh_token)
	const url = oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPE,
	});

	res.redirect(url);
});

dashboard.get("/authenticate", function (req, res, next) {
	const oauth2Client = new google.auth.OAuth2(
		process.env.BLOT_GOOGLEDRIVE_ID,
		process.env.BLOT_GOOGLEDRIVE_SECRET,
		REDIRECT_URL
	);

	// This will provide an object with the access_token and refresh_token.
	// Save these somewhere safe so they can be used at a later time.
	oauth2Client
		.getToken(req.query.code)
		.then(function (account) {
			console.log("setting credentials", account.tokens);
			creds = account.tokens;
			oauth2Client.setCredentials(account.tokens);
			listFiles(oauth2Client);

			database.setAccount(req.blog.id, account, function (err) {
				if (err) return next(err);
				res.send("Successfully saved account for " + req.blog.id);
			});
		})
		.catch(next);
});

dashboard.get("/list", function (req, res, next) {
	createClient(req.blog.id, function (err, drive) {
		if (err) return next(err);
		drive.files.list(
			{
				pageSize: 10,
				fields: "nextPageToken, files(id, name)",
			},
			(err, response) => {
				if (err) return next(err);
				res.locals.files = response.data.files;
				res.render("list");
			}
		);
	});
});

// Google Drive helping wrapper

function createClient(blogID, callback) {
	database.getAccount(blogID, function (err, account) {
		if (err) return callback(err);

		const oauth2Client = new google.auth.OAuth2(
			process.env.BLOT_GOOGLEDRIVE_ID,
			process.env.BLOT_GOOGLEDRIVE_SECRET,
			REDIRECT_URL
		);

		oauth2Client.on("tokens", (tokens) => {
			console.log(
				"Google drive client: Received new tokens for blog " + blogID
			);
			if (tokens.refresh_token) {
				database.setAccount(blogID, { tokens }, function (err) {
					if (err) console.log(err);
				});
			}
		});
		oauth2Client.setCredentials(account.tokens);
		const drive = google.drive({ version: "v3", auth: oauth2Client });
		return callback(null, drive);
	});
}

module.exports = dashboard;
