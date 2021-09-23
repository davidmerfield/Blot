const google = require("googleapis").google;
const database = require("../database");
const config = require("config");
const debug = require("debug")("blot:clients:google-drive");

module.exports = function client(blogID, callback) {
	let oauth2Client;
	let drive;

	debug("Blog", blogID, "creating Drive client");
	database.getAccount(blogID, function (err, account) {
		if (err) return callback(err);

		oauth2Client = new google.auth.OAuth2(
			config.google.drive.key,
			config.google.drive.secret
		);

		oauth2Client.on("error", (err) => {
			console.log("oauth2Client event: error", err);
		});

		oauth2Client.setCredentials({
			refresh_token: account.refresh_token,
			access_token: account.access_token,
			forceRefreshOnFailure: true,
		});

		drive = google.drive({ version: "v3", auth: oauth2Client });

		return callback(null, drive, account, oauth2Client);
	});
};
