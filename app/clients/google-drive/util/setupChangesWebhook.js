const config = require("config");
const guid = require("helper/guid");
const hash = require("helper/hash");
const createDriveClient = require("./createDriveClient");
const database = require("../database");
const clfdate = require("helper/clfdate");

const TEN_MINUTES = 1000 * 60 * 10; // in ms
const WEBHOOK_HOST = config.environment === "development" ? config.webhooks.relay_host : config.host;
const ADDRESS = `https://${WEBHOOK_HOST}/clients/google-drive/webhook`;

const prefix = () => clfdate() + " Google Drive:";

module.exports = async (drive, client_id) => {

  if (typeof client_id !== "string") throw new Error("Expected client_id to be a string");

  // check the db to prevent duplicate webhooks
  const channel = await database.channel.getByServiceAccountId(client_id);

  console.log(prefix(), "Creating channel for", client_id);

  if (channel) {
    const tenMinutesFromNow = Date.now() + TEN_MINUTES;

    // The channel will expire in more than ten minutes
    if (parseInt(channel.expiration) > tenMinutesFromNow) {
        console.log(prefix(), "Existing channel will expire in", channel.expiration - Date.now(), "ms", "no need to renew");
        return;
    } else {
        console.log(prefix(), "Existing channel needs to be renewed");
    }
  }

  try {

    const channelId = guid();
    const expectedSignatureInput = channelId + config.google_drive.webhook_secret;
    const token = hash(expectedSignatureInput);

    const pageToken = await database.serviceAccount.getPageToken(client_id) || await drive.changes.getStartPageToken({
        supportsAllDrives: true,
        supportsTeamDrives: true,
    });

    // attempt to set up a webhook
    const response = await drive.changes.watch({
      supportsAllDrives: true,
      includeDeleted: true,
      acknowledgeAbuse: true,
      includeCorpusRemovals: true,
      includeItemsFromAllDrives: true,
      restrictToMyDrive: false,
      requestBody: {
        id: channelId,
        token,
        type: "web_hook",
        kind: "api#channel",
        address: ADDRESS,
      },
    });

    const channel = {
      blogID,
      fileId,
      id: channelId,
      resourceId: response.data.resourceId,
      resourceUri: response.data.resourceUri,
      expiration: response.data.expiration,
    };
    
    await database.channel.set(channelId, channel);
    console.log(prefix(), "Webhook set up for", channel);

  } catch (e) {
    console.log(prefix(), "Error renewing webhook for", blogID, e);
  }
};
