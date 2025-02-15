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

module.exports = async (blogID, fileId) => {

  if (typeof blogID !== "string") throw new Error("Expected blogID to be a string");

  if (typeof fileId !== "string") throw new Error("Expected fileId to be a string");

  // check the db to prevent duplicate webhooks

  const channel = await database.channel.getByFileId(blogID, fileId);

  if (channel) {
    console.log(prefix(), "Webhook already exists for", blogID, fileId);

    const tenMinutesFromNow = Date.now() + TEN_MINUTES;

    // The channel will expire in more than ten minutes
    if (parseInt(channel.expiration) > tenMinutesFromNow) {
      console.log(prefix(), "Webhook will expire in", channel.expiration - Date.now(), "ms", "no need to renew");
      return;
    }

    await database.channel.drop(channel.id);
    console.log(prefix(), "Renewing webhook for", channel);
  }

  try {

    const drive = await createDriveClient(blogID);

    const channelId = guid();
    const expectedSignatureInput = blogID + channelId + config.google_drive.webhook_secret;
    const token = hash(expectedSignatureInput);

    // attempt to set up a webhook
    const response = await drive.files.watch({
      supportsAllDrives: true,
      includeDeleted: true,
      acknowledgeAbuse: true,
      includeCorpusRemovals: true,
      includeItemsFromAllDrives: true,
      restrictToMyDrive: false,
      fileId,
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
    if (e.message === "Invalid Credentials") {
      await database.setAccount(blogID, {
        error: "Invalid Credentials",
      });
    } else {
      await database.setAccount(blogID, {
        error: "Failed to set up webhook",
      });
    }

    console.log(prefix(), "Error renewing webhook for", blogID, e);
  }
};
