var async = require("async");
var Dropbox = require("dropbox");
var delta = require("./delta");
var Download = require("./download");
var Sync = require("sync");
var Database = require("../database");
var fs = require("fs-extra");
var join = require("path").join;
var debug = require("debug")("clients:dropbox:sync");

module.exports = function main(blog, callback) {
  debug("Beginning sync");

  // redlock options to ensure we acquire a lock eventually...
  Sync(blog.id, { retryCount: -1, retryDelay: 10, retryJitter: 10 }, function(
    err,
    folder,
    done
  ) {
    if (err) return callback(err);

    Database.get(blog.id, function(err, account) {
      if (err) return done(err, callback);

      debug("Retrieving changes from Dropbox...");

      delta(blog.id, account, function handle(err, changes, more, account) {
        if (err) return done(err, callback);

        debug("Retrieved changes", changes);

        var client = new Dropbox({ accessToken: account.access_token });

        var deleted = changes.filter(function(item) {
          return item[".tag"] === "deleted";
        });

        var folders = changes.filter(function(item) {
          return item[".tag"] === "folder";
        });

        var files = changes.filter(function(item) {
          return item[".tag"] === "file";
        });

        function remove(item, callback) {
          debug("Removing", item.path);
          fs.remove(join(folder.path, item.path), callback);
        }

        function mkdir(item, callback) {
          debug("Mkdiring", item.path);
          fs.ensureDir(join(folder.path, item.path), callback);
        }

        // Item.path_lower is the full path to the item
        // in the user's Dropbox. Don't confuse it with the
        // relative path to an item, since the root of the
        // Dropbox folder might not be the root of the blog.
        function download(item, callback) {
          debug("Downloading", item.path);
          Download(
            client,
            item.path_lower,
            join(folder.path, item.path),
            callback
          );
        }

        debug("Deleted:", deleted);
        debug("Folders:", folders);
        debug("Files:", files);

        async.parallel(
          [
            async.apply(async.each, deleted, remove),
            async.apply(async.each, folders, mkdir),
            async.apply(async.eachLimit, files, 20, download)
          ],
          function(err) {
            if (err) return done(err, callback);

            async.each(
              changes,
              function(item, next) {
                debug("Updating on Blot:", item.path);
                folder.update(item.path, { name: item.name }, next);
              },
              function(err) {
                if (err) return done(err, callback);

                if (more) return delta(blog.id, account, handle);

                debug("Storing latest greatest version of account...", account);

                Database.set(blog.id, account, function(err) {
                  if (err) return done(err, callback);

                  // We save the state before dealing with the changes
                  // to avoid an infinite loop if one of these changes
                  // causes an exception. If sync enounters an exception
                  // it will verify the folder at a later date

                  // If Dropbox says there are more changes
                  // we get them before returning the callback.
                  // This is important because a rename could
                  // be split across two pages of file events.

                  debug("Finished sync!");
                  done(null, callback);
                });
              }
            );
          }
        );
      });
    });
  });
};
