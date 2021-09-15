const client = require("./util/client");
const Sync = require("sync");
const database = require("./database");
const async = require("async");

// We ask for a longer TTL (timeout) for the sync lock because sometimes
// we hit Dropbox's rate limits, which tend to ask for a 5 minute (300s)
// delay before retrying a request. 30 minutes is requested, which should
// be plenty of time to sync a large folder.
var SYNC_OPTIONS = {
  retryCount: -1,
  retryDelay: 10,
  retryJitter: 10,
  ttl: 30 * 60 * 1000,
};

// I believe we want to use
// https://developers.google.com/drive/api/v3/reference/changes/list

module.exports = function (blogID, callback) {
  Sync(blogID, SYNC_OPTIONS, function (err, folder, done) {
    if (err) return callback(err);
    client(blogID, async function (err, drive, account) {
      if (err) return done(err, callback);

      let pageToken = account.pageToken;

      // The first time we call sync
      if (!pageToken) {
        const gotToken = await drive.changes.getStartPageToken();
        pageToken = gotToken.data.startPageToken;
      }

      const changesList = await drive.changes.list({
        pageToken,
        fields: "*",
      });
      const changes = changesList.data.changes;

      pageToken = changesList.data.newStartPageToken;

      const changesInFolder = changes.filter(
        (change) =>
          change.file &&
          change.file.parents &&
          change.file.parents.indexOf(account.folderID) > -1
      );

      async.eachSeries(
        changesInFolder,
        (change, next) => {
          console.log(change);
          return next();

          // if (change.removed) {

          // } else if (change.) {

          // }
        },
        (err) => {
          if (err) return done(err, callback);
          database.setAccount(blogID, { pageToken }, function (err) {
            done(err, callback);
          });
        }
      );
    });
  });
};
