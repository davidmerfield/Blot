const config = require("config");
const database = require("./database");
const google = require("googleapis").google;
const Blog = require("blog");
const Sync = require("sync");
const debug = require("debug")("blot:clients:google-drive");

module.exports = function disconnect(blogID, callback) {
	// We don't want to mess with the blog mid-sync
	Sync(blogID, async function (err, folder, done) {
		if (err) return callback(err);

		debug("getting account info");
		const account = await database.getAccount(blogID);

		if (err) return done(err, callback);

		if (account && account.access_token && account.refresh_token) {
			const auth = new google.auth.OAuth2(
				config.google.drive.key,
				config.google.drive.secret
			);

			auth.setCredentials({
				refresh_token: account.refresh_token,
				access_token: account.access_token,
			});

			if (account.channel) {
				try {
					debug("attempting to stop listening to webhooks");
					const drive = google.drive({ version: "v3", auth });
					await drive.channels.stop({
						requestBody: account.channel,
					});
					debug("stop listening to webhooks successfully");
				} catch (e) {
					debug("failed to stop webhooks but no big deal:", e.message);
					debug("it will expire automatically");
				}
			}

			// destroys the oauth2Client's active
			// refresh_token and access_token
			try {
				debug("trying to revoke google api credentials");
				await auth.revokeCredentials();
			} catch (e) {
				debug("failed to revoke but no big deal:", e.message);
			}
		}

		debug("dropping blog from database");
		await database.dropAccount(blogID);

		debug("resetting client setting");
		Blog.set(blogID, { client: "" }, async function (err) {
			if (err) return done(err, callback);
			done(null, callback);
		});
	});
};
