const config = require('config');
const guid = require("helper/guid");
const hash = require("helper/hash");
const querystring = require("querystring");
const createDriveClient = require('./createDriveClient');
const database = require('../database');

module.exports = async (blogID, resourceId) => {

    const drive = await createDriveClient(blogID);
    const account = await database.getAccount(blogID);

    const id = guid();
    const expectedSignatureInput = blogID + id + config.session.secret;
    const expectedSignature = hash(expectedSignatureInput);

    const { data: { startPageToken } } = await drive.changes.getStartPageToken({
      supportsAllDrives: true,
    });

    // attempt to set up a webhook
    const response = await drive.files.watch({
      supportsAllDrives: true,
      includeDeleted: true,
      acknowledgeAbuse: true,
      includeCorpusRemovals: true,
      includeItemsFromAllDrives: true,
      restrictToMyDrive: false,
      fileId: resourceId,
      requestBody: {
        id: id,
        resourceId,
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
  });
    await database.folder(account.folderId).setPageToken(startPageToken);
    await database.setAccount(blogID, { channel: response.data });

}