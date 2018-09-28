var helper = require("helper");
var async = require("async");
var Dropbox = require("dropbox");
var delta = require("./delta");
var localPath = helper.localPath;
var download = require("./download");
var Sync = require("sync");
var Database = require("../database");
var dropbox_content_hash = require("./dropbox_content_hash");
var fs = require("fs-extra");

module.exports = function main(blogID, callback) {
  Database.get(blogID, function(err, account) {
    if (err) return callback(err);

    Sync(
      blogID,
      function(update, callback) {
        delta(blogID, account, function handle(err, changes, has_more) {
          if (err) return callback(err);

          async.eachSeries(
            changes,
            function(change, next) {
              var path = change.path;
              var local_path = localPath(blogID, path);
              var dropbox_path = change.path_lower;
              var client = new Dropbox({ accessToken: account.access_token });
              var options = { name: change.name };

              if (change[".tag"] === "deleted") {
                fs.remove(local_path, function(err) {
                  update(path, options, next);
                });
              } else if (change[".tag"] === "folder") {
                fs.ensureDir(local_path, function(err) {
                  update(path, options, next);
                });
              } else if (change[".tag"] === "file") {
                dropbox_content_hash(local_path, function(err, existing_hash) {
                  if (existing_hash && existing_hash === change.content_hash) {
                    console.log(
                      "Blog:",
                      blogID,
                      change.path_lower,
                      "already has the same version stored locally. Do nothing."
                    );
                    return next();
                  }

                  download(client, dropbox_path, local_path, function(err) {
                    if (err) {
                      console.log(err);
                      return next();
                    }
                    update(path, options, next);
                  });
                });
              } else {
                console.log("I do not know what to do with this file");
                return next();
              }
            },
            function() {
              // If Dropbox says there are more changes
              // we get them before returning the callback.
              // This is important because a rename could
              // be split across two pages of file events.
              if (has_more) {
                console.log("Blog:", blogID, "has more changes to sync!");
                return delta(blogID, account, handle);
              }

              callback();
            }
          );
        });
      },
      callback
    );
  });
};
