const client = require("./util/client");
const Sync = require("sync");
const database = require("./database");

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

      if (!pageToken) {
        const gotToken = await drive.changes.getStartPageToken();
        pageToken = gotToken.data.startPageToken;
      }

      const changesList = await drive.changes.list({ pageToken });
      const changes = changesList.data.changes;
      const newStartPageToken = changesList.data.newStartPageToken;

      console.log("changes", changes);
      database.setAccount(blogID, { pageToken, newStartPageToken }, function (
        err
      ) {
        done(null, callback);
      });
    });
  });
};
