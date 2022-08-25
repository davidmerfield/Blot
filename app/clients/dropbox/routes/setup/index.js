const sync = require("sync");

const promisify = require("util").promisify;
const database = require("clients/dropbox/database");
const set = promisify(database.set);

const getAccount = require("./getAccount");
const createFolder = require("./createFolder");
const syncContents = require("./syncContents");

function setup(account, session, callback) {
  sync(account.blog.id, async function (err, folder, done) {
    if (err) return callback(err);

    try {
      folder.status("Loading your Dropbox account information");
      account = await getAccount(account);
      session.save();
      folder.status("Creating a folder in Dropbox for your blog");
      account = await createFolder(account);
      session.save();
      folder.status("Transferring files in your folder to Dropbox");
      account = await syncContents(account, folder);
    } catch (err) {
      folder.status("Error: " + err.message);
      delete session.dropbox;
      session.save();
      return done(err, callback);
    }

    delete session.dropbox;
    session.save();
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
    return done(null, callback);
  });
}

module.exports = setup;
