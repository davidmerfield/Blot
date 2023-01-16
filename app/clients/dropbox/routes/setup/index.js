const sync = require("sync");
const redis = require("redis");

const promisify = require("util").promisify;
const database = require("clients/dropbox/database");
const set = promisify(database.set);

const getAccount = require("./getAccount");
const createFolder = require("./createFolder");
const syncContents = require("./syncContents");

function setup(account, session, callback) {
  sync(account.blog.id, async function (err, folder, done) {
    if (err) return callback(err);

    const client = redis.createClient();
    const signal = { aborted: false };
    const cleanup = () => {
      console.log('Cleaning up Dropbox setup');
      try {
        delete session.dropbox;
        session.save();
        client.unsubscribe();
        client.quit();
      } catch (e) {
        console.log('Error cleaning up:', err);
      }
    };

    client.subscribe("sync:status:" + account.blog.id);

    client.on("message", function (channel, message) {
      if (message !== "Attempting to disconnect from Dropbox") return;
      signal.aborted = true;
      cleanup();
      done(new Error("Aborted setup"), callback);
    });

    try {
      folder.status("Loading your Dropbox account information");
      account = await getAccount(account);
      if (signal.aborted) return;
      session.save();

      folder.status("Creating a folder in Dropbox for your blog");
      account = await createFolder(account, signal);
      if (signal.aborted) return;
      session.save();

      folder.status("Transferring files in your folder to Dropbox");
      account = await syncContents(account, folder, signal);
      if (signal.aborted) return;
    } catch (err) {
      folder.status("Error: " + err.message);
      cleanup();
      return done(err, callback);
    }

    await set(account.blog.id, {
      account_id: account.account_id,
      email: account.email,
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      error_code: 0,
      last_sync: Date.now(),
      full_access: account.full_access,
      folder: account.folder,
      folder_id: account.folder_id,
      cursor: "",
    });    
    cleanup();
    done(null, callback);
  });
}

module.exports = setup;
