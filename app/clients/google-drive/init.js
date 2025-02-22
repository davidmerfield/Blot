const config = require("config");

const fetchStorageInfo = require("./serviceAccount/fetchStorageInfo");
const watchChanges = require("./serviceAccount/watchChanges");
const createDriveClient = require("./serviceAccount/createDriveClient");
const purgeWebhooks = require("./serviceAccount/purgeWebhooks");

const clfdate = require("helper/clfdate");
const prefix = () => `${clfdate()} Google Drive client:`;
const TEN_MINUTES = 1000 * 60 * 10; // 10 minutes in milliseconds

const main = async () => {
  const serviceAccounts = config.google_drive.service_accounts;

  if (!serviceAccounts || serviceAccounts.length === 0) {
    console.log(prefix(), "No service accounts found in the configuration.");
    return;
  }

  for (const { client_id: serviceAccountId } of serviceAccounts) {
    try {
      const drive = await createDriveClient(serviceAccountId);
      console.log(prefix(), "Fetching storage usage of service account");
      await fetchStorageInfo(serviceAccountId, drive);
      // console.log(prefix(), "Purging old webhooks for service account");
      // await purgeWebhooks(serviceAccountId, drive);
      console.log(prefix(), "Ensuring service account is watching for changes");
      await watchChanges(serviceAccountId, drive);
      console.log(prefix(), "Service account is running successfully");
    } catch (e) {
      console.error("Google Drive client:", e.message);
    }
  }

};


module.exports = async () => {
  main();
  // we do this repeatedly every 10 minutes
  // to refresh the service account data
  // and renew the changes.watch channel
  setInterval(main, TEN_MINUTES);
}