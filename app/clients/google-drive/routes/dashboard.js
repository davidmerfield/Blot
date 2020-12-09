// https://developers.google.com/drive/api/v3/quickstart/nodejs

const { google } = require("googleapis");

const REDIRECT_URL = "http://localhost:8822/clients/googledrive/authenticate";

const SCOPE = ["https://www.googleapis.com/auth/drive"];



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



module.exports = dashboard;
