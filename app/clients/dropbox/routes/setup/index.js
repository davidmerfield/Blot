const async = require("async");
const sync = require("sync");

const promisify = require("util").promisify;
const database = require("clients/dropbox/database");
const set = promisify(database.set);

const getAccount = require("./getAccount");
const createFolder = require("./createFolder");
const syncContents = require("./syncContents");
const progress = require("./progress");

function setup(account, session, callback) {
  sync(account.blog.id, function (err, folder, done) {
    if (err) return callback(err);

    const sendProgress = progress(session, folder.status);

    const tasks = [
      function (callback) {
        sendProgress("getAccount");
        callback(null, account);
      },
      getAccount,
      function (account, callback) {
        sendProgress("createFolder");
        callback(null, account);
      },
      createFolder,
      function (account, callback) {
        sendProgress("syncContents");
        callback(null, account, folder.lowerCaseContents);
      },
      syncContents,
    ];

    async.waterfall(tasks, async function (err, account) {
      delete session.dropbox;
      session.save();

      if (!err) {
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
      }
      if (err) {
        folder.status("Error: " + err.message);
      }
      done(err, callback);
    });
  });
}

module.exports = setup;
