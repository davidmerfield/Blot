// IMPORTANT:
//
// If you make changes to this you will need to run sudo stop blot
// && sudo start blot when you deploy. Simply restarting won't work.

const debug = require("debug")("blot:clients:google-drive");
const clfdate = require("helper/clfdate");
const database = require("./database");
const setupWebhook = require("./util/setupWebhook");
const TEN_MINUTES = 1000 * 60 * 10; // in ms

const prefix = () => clfdate() + " Google Drive client:";

module.exports = () => {
  refreshWebhookChannels();
  setInterval(refreshWebhookChannels, TEN_MINUTES);
};

const refreshWebhookChannels = async () => {
  console.log(prefix(), "Looking for accounts to renew webhooks ");
  const accounts = await database.allAccounts();
  for (const account of accounts) {
    if (!account.folderId || !account.channel) continue;
    const tenMinutesFromNow = Date.now() + TEN_MINUTES;

    // The channel will expire in more than ten minutes
    if (parseInt(account.channel.expiration) > tenMinutesFromNow) {
      debug("No need to renew channel for ", account);
      continue;
    }

    console.log(prefix(), "Renewing webhook for", account.blogID);
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

      console.log(prefix(), "Error renewing webhook for", account.blogID, e);
    }
  }
};
