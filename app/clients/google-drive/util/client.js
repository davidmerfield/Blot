// Google Drive helping wrapper
module.exports = function client(blogID, callback) {
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
};
