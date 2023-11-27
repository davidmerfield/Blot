const config = require("config");
const google = require("googleapis").google;
const database = require("../database");
const debug = require("debug")("blot:clients:google-drive");

module.exports = async function createDriveClient(blogID) {
	debug("Blog", blogID, "creating Drive client");
	const account = await database.getAccount(blogID);
	const oauth2Client = new google.auth.OAuth2(
		config.google.drive.key,
		config.google.drive.secret
	);
	oauth2Client.setCredentials({
		refresh_token: account.refresh_token,
		access_token: account.access_token,
		expiry_date: account.expiry_date,
	});
	const drive = google.drive({ version: "v3", auth: oauth2Client });
	debug("Blog", blogID, "created Drive client");
	return { drive, account };
};
