const config = require('config');
const guid = require("helper/guid");
const hash = require("helper/hash");
const querystring = require("querystring");
const createDriveClient = require('./createDriveClient');
const database = require('../database');
const file = require('../../../dashboard/site/folder/file');
const debug = require("debug")("blot:clients:google-drive");

module.exports = async (blogID) => {

    const drive = await createDriveClient(blogID);
    const account = await database.getAccount(blogID);

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
      
    const {folderId} = account;

    const id = guid();
    const expectedSignatureInput = blogID + id + config.session.secret;
    const expectedSignature = hash(expectedSignatureInput);

    const { data: { startPageToken } } = await drive.changes.getStartPageToken({
      supportsAllDrives: true,
    });

    // attempt to set up a webhook

    console.log('setting up webhook...');

    const payload = {
      supportsAllDrives: true,
      includeDeleted: true,
      acknowledgeAbuse: true,
      includeCorpusRemovals: true,
      includeItemsFromAllDrives: true,
      restrictToMyDrive: false,
      fileId: folderId,
      // Request body metadata
      requestBody: {
        id: id,
        resourceId: folderId,
        type: "web_hook",
        token: querystring.stringify({
            blogID,
            signature: expectedSignature,
        }),
      kind: "api#channel",
      address: `https://${
          config.environment === "development"
          ? config.webhooks.relay_host
          : config.host
      }/clients/google-drive/webhook`,
      },
  };
    console.log('payload:', payload);
    const response = await drive.files.watch(payload);
    console.log('response:', response);
    await database.folder(account.folderId).setPageToken(startPageToken);
    await database.setAccount(blogID, { channel: response.data });

}