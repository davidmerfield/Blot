var debug = require("debug")("clients:dropbox:sync");
var Download = require("./util/download");
var Database = require("./database");
var join = require("path").join;
var Delta = require("./delta");
var fs = require("fs-extra");
var async = require("async");
var Sync = require("sync");

// We ask for a longer TTL (timeout) for the sync lock because sometimes
// we hit Dropbox's rate limits, which tend to ask for a 5 minute (300s)
// delay before retrying a request. 30 minutes is requested, which should
// be plenty of time to sync a large folder.
var syncOptions = {
  retryCount: -1,
  retryDelay: 10,
  retryJitter: 10,
  ttl: 30 * 60 * 1000
};

module.exports = function main(blog, callback) {
  debug("Blog:", blog.id, "Attempting to acquire lock on the blog folder.");

  // Redlock options to ensure we acquire a lock eventually...
  // pershaps we should keep track and only issue a second pending sync
  // to prevent an infinite stack of webhooks.
  Sync(blog.id, syncOptions, function(err, folder, done) {
    if (err) return callback(err);

    debug("Blog:", blog.id, "Lock acquired successfully. Beginning sync...");

    // We need to look up the Dropbox account for this blog
    // to retrieve the access token used to create a new Dropbox
    // client to retrieve changes made to the user's Dropbox.
    Database.get(blog.id, function(err, account) {
      if (err) return done(err, callback);

      var token = account.access_token;
      var delta = new Delta(token, account.folder_id);
      var apply = new Apply(token, folder.path);

      // Delta retrieves changes to the folder on Dropbox for a given
      // blog. It returns a list of changes. It also adds a new property
      // to each change, relative_path. Use change.relative_path
      // as the 'Blot' path, this is the path of the change relative to the
      // blog folder in the user's Dropbox folder.
      delta(account.cursor, function handle(err, result) {
        if (err) {
          console.log("Blog", blog.id, "Dropbox Error:", err);
          return Database.set(
            blog.id,
            { error_code: err.status || 400 },
            function(err) {
              done(err, callback);
            }
          );
        }

        debug("Retrieved", result.entries.length, "changes");

        // Now we attempt to apply the changes which occured in the
        // user's folder on Dropbox to the blog folder on Blot's server.
        // This means making any new directories, downloading any new
        // or changed files, and removing any deleted items.
        apply(result.entries, function(err) {
          if (err) {
            console.log("Blog", blog.id, "Dropbox Error:", err);
            return Database.set(
              blog.id,
              { error_code: err.status || 400 },
              function(err) {
                done(err, callback);
              }
            );
          }
          // we have successfully applied this batch of changes
          // to the user's Dropbox folder. Now we save the new
          // cursor and folderID and folder path to the database.
          // This means that future webhooks will invoke calls to
          // delta which return changes made after this point in time.
          account.error_code = 0;
          account.last_sync = Date.now();
          account.cursor = result.cursor;
          // we store account folder for use on the dashboard
          if (result.path_display) account.folder = result.path_display;

          debug("Storing latest cursor and folder information...", account);

          Database.set(blog.id, account, function(err) {
            if (err) return done(err, callback);

            // Now we report back to Blot about the changes made during
            // this synchronization. We don't care about errors because
            // those lie beyond the scope of this client. Its responsibilty
            // is to ensure the blog folder on Blot's server is in sync.
            // We must do this in series until entry.set becomes
            // atomic. Right now, making changes to the blog's
            // menu cannot be done concurrently, hence eachSeries!
            async.eachSeries(
              result.entries,
              function(item, next) {
                debug("Updating on Blot:", item.relative_path);

                // The items's relative path is computed by delta, based on the
                // current path to the blog's folder in the user's Dropbox.
                // The relative path is also lowercase. This is because Dropbox
                // is case-insensitive but the file system for Blot's server is not.
                // We therefore pass the name of the file, which has its case preserved
                // to update, so things like automatic title generation based on the
                // file can be computed nicely.
                folder.update(item.relative_path, { name: item.name }, next);
              },
              function() {
                // If Dropbox says there are more changes
                // we get them before returning the callback.
                // This is important because a rename could
                // be split across two pages of file events.
                if (result.has_more) {
                  debug("There are more change to fetch");
                  return delta(result.cursor, handle);
                }

                debug("Finished sync!");
                done(null, callback);
              }
            );
          });
        });
      });
    });
  });
};

function Apply(token, blogFolder) {
  return function apply(changes, callback) {
    debug("Retrieved changes", changes);

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
      debug("Removing", item.relative_path);
      fs.remove(join(blogFolder, item.relative_path), function(err) {
        // This error happens if you try to remove a non-existent file
        // inside a non-existent folder whose name happens to be the same
        // as an existent file. For example, create a file 'hello.txt' then
        // try to remove hello.txt/bar.txt, you will get this error.
        // Since we don't care, we suppress it.
        if (err && err.code === "ENOTDIR") return callback();

        callback(err);
      });
    }

    function mkdir(item, callback) {
      debug("Mkdiring", item.relative_path);
      fs.ensureDir(join(blogFolder, item.relative_path), callback);
    }

    // Item.path_lower is the full path to the item
    // in the user's Dropbox. Don't confuse it with the
    // relative path to an item, since the root of the
    // Dropbox folder might not be the root of the blog.
    function download(item, callback) {
      debug("Downloading", item.relative_path);
      Download(
        token,
        item.path_lower,
        join(blogFolder, item.relative_path),
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
      callback
    );
  };
}
