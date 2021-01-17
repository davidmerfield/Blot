const google = require("googleapis").google;
const database = require("../database");
const config = require("config");

module.exports = function client(blogID, callback) {
	let oauth2Client;
	let drive;

	database.getAccount(blogID, function (err, account) {
		if (err) return callback(err);

		oauth2Client = new google.auth.OAuth2(
			config.google.drive.key,
			config.google.drive.secret
		);

		// Read more about this
		oauth2Client.on("tokens", (tokens) => {
			if (tokens.refresh_token) {
				database.setAccount(blogID, { tokens }, function (err) {});
			}
		});

		oauth2Client.setCredentials(account.tokens);
		drive = google.drive({ version: "v3", auth: oauth2Client });
		return callback(null, drive);
	});
};
