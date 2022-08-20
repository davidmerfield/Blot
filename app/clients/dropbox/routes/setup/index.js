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
        callback(null, account);
      },
      syncContents,
    ];

    async.waterfall(tasks, async function (err, account) {
      if (!err) {
        await set(account.blog.id, account);
        delete session.dropbox;
        session.save();
      }

      done(err, callback);
    });
  });
}

module.exports = setup;
