const config = require("config");
const database = require("./database");
const google = require("googleapis").google;
const Blog = require("blog");
const Sync = require("sync");
const debug = require("debug")("blot:clients:google-drive");

module.exports = function disconnect(blogID, callback) {
	// We don't want to mess with the blog mid-sync
	Sync(blogID, function (err, folder, done) {
		if (err) return callback(err);

		debug("getting account info");
		database.getAccount(blogID, async function (err, account) {
			if (err) return done(err, callback);

			if (account && account.access_token && account.refresh_token) {
				const oauth2Client = new google.auth.OAuth2(
					config.google.drive.key,
					config.google.drive.secret
				);

				oauth2Client.setCredentials({
					refresh_token: account.refresh_token,
					access_token: account.access_token,
				});

				// destroys the oauth2Client's active
				// refresh_token and access_token
				debug("revoking google api credentials");
				await oauth2Client.revokeCredentials();
			}

			debug("resetting client setting");
			Blog.set(blogID, { client: "" }, function (err) {
				if (err) return done(err, callback);

				debug("dropping blog from database");
				database.dropAccount(blogID, function () {
					if (err) return done(err, callback);

					done(null, callback);
				});
			});
		});
	});
};
