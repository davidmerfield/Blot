const config = require("config");
const database = require("./database");
const google = require("googleapis").google;
const Blog = require("models/blog");
const establishSyncLock = require("./util/establishSyncLock");
const debug = require("debug")("blot:clients:google-drive");

async function disconnect(blogID, callback) {
	let done;

	try {
		let lock = await establishSyncLock(blogID);
		done = lock.done;
	} catch (err) {
		return callback(err);
	}

	debug("getting account info");
	const account = await database.getAccount(blogID);

	if (account && account.access_token && account.refresh_token) {
		const canRevoke = await database.canRevoke(account.permissionId);
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

		// We need to preserve Blot's access to this Google
		// Drive account if another blog uses it. Unfortunately
		// it seems impossible to simple revoke one blog's access
		// other blogs connected to the account lose access too.
		if (canRevoke) {
			try {
				debug("Trying to revoke Google API credentials");
				// destroys the oauth2Client's active
				// refresh_token and access_token
				await auth.revokeCredentials();
			} catch (e) {
				debug("Failed to revoke but token should expire naturally", e.message);
			}
		}
	}

	debug("dropping blog from database");
	await database.dropAccount(blogID);

	debug("resetting client setting");
	Blog.set(blogID, { client: "" }, async function (err) {
		await done(err);
		callback();
	});
}

module.exports = disconnect;
