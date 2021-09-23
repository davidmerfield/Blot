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

		// Read more about this
		oauth2Client.on("tokens", (tokens) => {
			console.log('here with tokens', tokens);
			if (tokens.refresh_token) {
				debug("Blog", blogID, "used refresh_token to fetch new tokens");
				database.setAccount(blogID, { tokens }, function (err) {
					if (err) {
						console.log(
							"Blog:",
							blogID,
							"Error storing new Google Drive tokens",
							err
						);
					} else {
						debug("Blog", blogID, "saved new Drive client tokens");
					}
				});
			}
		});

		oauth2Client.setCredentials({
			refresh_token: account.refresh_token,
			access_token: account.access_token,
		});

		drive = google.drive({ version: "v3", auth: oauth2Client });

		return callback(null, drive, account, oauth2Client);
	});
};
