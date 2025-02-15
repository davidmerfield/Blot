const Blog = require("models/blog");
const establishSyncLock = require("./util/establishSyncLock");
const database = require("./database");
const createDriveClient = require("./util/createDriveClient");
const debug = require("debug")("blot:clients:google-drive");
const config = require("config");
const WEBHOOK_HOST = config.environment === "development" ? config.webhooks.relay_host : config.host;
const ADDRESS = `https://${WEBHOOK_HOST}/clients/google-drive/webhook`;

module.exports = async (blogID, callback) => {
    let done;

    try {
        let lock = await establishSyncLock(blogID);
        done = lock.done;
    } catch (err) {
        return callback(err);
    }

    // add method to process all channels with a given blogID
    // we do not wait for this to complete because it is not
    // critical to the disconnection process and it takes a long time
    database.channel.processAll(async (channel) => {
        
      if (channel.blogID !== blogID) return;

        try {
          const drive = await createDriveClient(blogID);
          await database.channel.drop(channel.id);
          debug("attempting to stop listening to webhooks");
          const res = await drive.channels.stop({
            requestBody: {
              id: channel.id,
              resourceId: channel.resourceId,
              resourceUri: channel.resourceUri,
              type: "web_hook",
              kind: "api#channel",
              address: ADDRESS,
            }
          });
          
          if (res.data !== '') throw new Error("Failed to stop listening to webhooks: " + res.data);

          debug("stop listening to webhooks successfully", res);
        } catch (e) {
          debug("failed to stop webhooks but no big deal:", e.message);
          debug("it will expire automatically");
        }
      });

    
    await database.dropAccount(blogID);

    Blog.set(blogID, { client: "" }, async function (err) {
        await done(err);
        callback();
    });
};