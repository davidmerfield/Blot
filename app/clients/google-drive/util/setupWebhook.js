const guid = require("helper/guid");
const hash = require("helper/hash");
const querystring = require("querystring");
const database = require("../database");
const config = require("config");
const createDriveClient = require("./createDriveClient");
const debug = require("debug")("blot:clients:google-drive");

module.exports = async (blogID) => {
  const { drive, account } = await createDriveClient(blogID);

  if (account.channel) {
    try {
      debug("attempting to stop listening to webhooks");
      await drive.channels.stop({
        requestBody: account.channel,
      });
      debug("stop listening to webhooks successfully");
    } catch (e) {
      debug("failed to stop webhooks but no big deal:", e.message);
      debug("it will expire automatically");
    }
  }

  const {
    data: { startPageToken },
  } = await drive.changes.getStartPageToken({
    supportsAllDrives: true,
  });
  const id = guid();
  const expectedSignatureInput = blogID + id + config.session.secret;
  const expectedSignature = hash(expectedSignatureInput);

  const response = await drive.changes.watch({
    // Whether the user is acknowledging the risk of downloading known malware or other abusive files.
    // The ID for the file in question.
    supportsAllDrives: true,
    includeDeleted: true,
    includeCorpusRemovals: true,
    includeItemsFromAllDrives: true,
    pageToken: startPageToken,
    // Request body metadata
    requestBody: {
      id: id,
      resourceId: account.folderId,
      type: "web_hook",
      token: querystring.stringify({
        blogID: blogID,
        signature: expectedSignature,
      }),
      kind: "api#channel",
      address: `https://${
        config.environment === "development"
          ? config.webhooks.relay_host
          : config.host
      }/clients/google-drive/webhook`,
    },
  });

  await database.folder(account.folderId).setPageToken(startPageToken);
  await database.setAccount(blogID, { channel: response.data });
};
