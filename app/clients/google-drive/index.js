module.exports = {
  display_name: "Google Drive",
  description: "A file storage and synchronization service",
  disconnect: require("./disconnect"),
  remove: require("./remove"),
  write: require("./write"),
  site_routes: require("./routes/site"),
  dashboard_routes: require("./routes/dashboard"),
};

// thiS SHOULD only run on one process (main)
const debug = require("debug")("blot:clients:google-drive");
const clfdate = require("helper/clfdate");
const database = require("./database");
const setupWebhook = require("./util/setupWebhook");
const TEN_MINUTES = 1000 * 60 * 10; // in ms

const refreshWebhookChannels = async () => {
  console.log(
    clfdate(),
    "Looking for Google Drive accounts to renew webhooks for"
  );
  const accounts = await database.allAccounts();
  for (const account of accounts) {
    if (!account.folderID || !account.channel) continue;
    const tenMinutesFromNow = Date.now() + TEN_MINUTES;

    // The channel will expire in more than ten minutes
    if (parseInt(account.channel.expiration) > tenMinutesFromNow) {
      debug("No need to renew channel for ", account);
      continue;
    }

    console.log(clfdate(), "Renewing Google Drive webhook for", account.blogID);
    try {
      await setupWebhook(account.blogID);
    } catch (e) {
      
      if (e.message === "Invalid Credentials") {
        await database.setAccount(account.blogID, {
          channel: null,
          error: "Invalid Credentials",
        });
      } else {
        await database.setAccount(account.blogID, {
          channel: null,
          error: "Failed to set up webhook",
        });
      }

      console.log(
        clfdate(),
        "Error renewing Google Drive webhook for",
        account.blogID,
        e
      );
    }
  }
};

refreshWebhookChannels();
setInterval(refreshWebhookChannels, TEN_MINUTES);

const { webhook_forwarding_host } = require("config");
const { spawn } = require("child_process");

if (webhook_forwarding_host) {
  console.log(clfdate(), "Spawning webhook_forwarding_host tunnel");
  spawn("ssh", [
    "-R",
    webhook_forwarding_host + ":80:localhost:80",
    "localhost.run",
  ]);
}
