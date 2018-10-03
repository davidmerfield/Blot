var debug = require("debug")("clients:dropbox:sync");
var join = require("path").join;
var fs = require("fs-extra");
var async = require("async");
var Sync = require("sync");

var delta = require("./util/delta");
var Download = require("./util/download");

var Database = require("./database");
var syncOptions = { retryCount: -1, retryDelay: 10, retryJitter: 10 };

module.exports = function main(blog, callback) {
  debug("Blog:", blog.id, "Attempting to acquire lock on the blog folder.");

  // redlock options to ensure we acquire a lock eventually...
  Sync(blog.id, syncOptions, function(err, folder, done) {
    if (err) return callback(err);

    debug("Blog:", blog.id, "Lock acquired successfully. Beginning sync...");

    // We need to look up the Dropbox account for this blog
    // to retrieve the access token used to create a new Dropbox
    // client to retrieve changes made to the user's Dropbox.
    Database.get(blog.id, function(err, account) {
      if (err) return done(err, callback);

      // Delta retrieves changes to the folder on Dropbox for a given
      // blog. It returns a list of changes. It also adds a new property
      // to each change, relative_path. Use change.relative_path
      // as the 'Blot' path, this is the path of the change relative to the
      // blog folder in the user's Dropbox folder.
      delta(blog.id, account, function handle(err, changes, more, account) {
        if (err) return done(err, callback);

        // Now we attempt to apply the changes which occured in the
        // user's folder on Dropbox to the blog folder on Blot's server.
        // This means making any new directories, downloading any new
        // or changed files, and removing any deleted items.
        apply(changes, folder.path, account.access_token, function(err) {

          if (err) return done(err, callback);

          // we have successfully applied this batch of changes
          // to the user's Dropbox folder. Now we save the new
          // cursor and folderID and folder path to the database.
          // This means that future webhooks will invoke calls to
          // delta which return changes made after this point in time.
          debug("Storing latest cursor and folder information...", account);
          Database.set(blog.id, account, function(err) {
            if (err) return done(err, callback);

            // Now we report back to Blot about the changes made during
            // this synchronization. We don't care about errors because
            // those lie beyond the scope of this client. Its responsibilty
            // is to ensure the blog folder on Blot's server is in sync.
            async.each(
              changes,
              function(item, next) {
                debug("Updating on Blot:", item.path);
                folder.update(item.path, { name: item.name }, next);
              },
              function() {
                // If Dropbox says there are more changes
                // we get them before returning the callback.
                // This is important because a rename could
                // be split across two pages of file events.
                if (more) return delta(blog.id, account, handle);

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

function apply(changes, blogFolder, token, callback) {
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
    debug("Removing", item.path);
    fs.remove(join(blogFolder, item.path), callback);
  }

  function mkdir(item, callback) {
    debug("Mkdiring", item.path);
    fs.ensureDir(join(blogFolder, item.path), callback);
  }

  // Item.path_lower is the full path to the item
  // in the user's Dropbox. Don't confuse it with the
  // relative path to an item, since the root of the
  // Dropbox folder might not be the root of the blog.
  function download(item, callback) {
    debug("Downloading", item.path);
    Download(token, item.path_lower, join(blogFolder, item.path), callback);
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
}
