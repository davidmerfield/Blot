var async = require("async");
var delta = require("./delta");
var Sync = require("sync");
var Database = require("../database");
var Dropbox = require("dropbox");
var change = require("./change");

module.exports = function main(blogID, callback) {
  Database.get(blogID, function(err, account) {
    if (err) return callback(err);

    Sync(blogID, function(err, update, release) {
      if (err) return callback(err);

      delta(blogID, account, function handle(err, changes, has_more) {
        if (err) return release(err);

        var client = new Dropbox({ accessToken: account.access_token });

        async.eachSeries(changes, change(client, update), function(err) {
          if (err) return release(err);

          release(function(err, retry) {
            // If Dropbox says there are more changes
            // we get them before returning the callback.
            // This is important because a rename could
            // be split across two pages of file events.
            if (retry || has_more) {
              console.log("Blog:", blogID, "has more changes to sync!");
              return main(blogID, callback);
            }

            callback(null);
          });
        });
      });
    });
  });
};
