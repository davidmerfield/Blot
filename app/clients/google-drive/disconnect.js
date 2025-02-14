const Blog = require("models/blog");
const establishSyncLock = require("./util/establishSyncLock");
const database = require("./database");
const createDriveClient = require("./util/createDriveClient");
const debug = require("debug")("blot:clients:google-drive");

module.exports = async (blogID, callback) => {
    let done;

    try {
        let lock = await establishSyncLock(blogID);
        done = lock.done;
    } catch (err) {
        return callback(err);
    }

    const account = await database.getAccount(blogID);

    if (account && account.channel) {
        const drive = await createDriveClient(blogID);
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

    await database.dropAccount(blogID);

    Blog.set(blogID, { client: "" }, async function (err) {
        await done(err);
        callback();
    });
};