const clfdate = require("helper/clfdate");
const database = require("./database");
const setupWebhook = require("./util/setupFilesWebhook");
const config = require("config");
const { google } = require('googleapis');

const prefix = () => clfdate() + " Google Drive client:";
const TEN_MINUTES = 1000 * 60 * 10; // in ms

module.exports = () => {
  refreshServiceAccounts();
  setInterval(refreshServiceAccounts, TEN_MINUTES);
  refreshWebhookChannels();
  setInterval(refreshWebhookChannels, TEN_MINUTES);
};

const refreshServiceAccounts = async () => {
    config.google_drive.service_accounts.forEach(async (credentials) => {
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive'],
          });
        
        const drive = google.drive({ version: 'v3', auth });

        console.log(prefix(), "Service account client_id=" + credentials.client_id, "Fetching storage quota");

        try {
            const res = await drive.about.get({
                fields: 'user, storageQuota'
            });
            console.log(prefix(), "Service account client_id=" + credentials.client_id, res.data.storageQuota.usage / 1024 / 1024, "of", res.data.storageQuota.limit / 1024 / 1024, "MB used"); 
            await database.serviceAccount.set(credentials.client_id, res.data);

            // await setupChangesWebhook(drive, credentials.client_id);
        } catch (e) {
            console.log(prefix(), "Failed to update service account", e);
        }
    });
}

const refreshWebhookChannels = async () => {
  console.log(prefix(), "Looking for channels to renew");
  await database.channel.processAll(async (channel) => {
    await setupWebhook(channel.blogID, channel.fileId);
  });
};
