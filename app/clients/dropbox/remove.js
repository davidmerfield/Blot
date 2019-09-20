var debug = require("debug")("clients:dropbox:remove");
var createClient = require("./util/createClient");
var database = require("./database");
var join = require("path").join;
var fs = require("fs-extra");
var localPath = require("helper").localPath;
var retry = require("./util/retry");
var waitForErrorTimeout = require("./util/waitForErrorTimeout");

// Remove should only ever be called inside the function returned
// from Sync for a given blog, since it modifies the blog folder.
// This method is mildly complicated by the desire to ensure that
// if we fail to remove the file from Dropbox, then we do not
// remove the file from Blot's folder for this blog.
function remove(blogID, path, callback) {
  var client, pathOnDropbox, pathOnBlot;

  debug("Blog:", blogID, "Removing", path);

  database.get(blogID, function(err, account) {
    client = createClient(account.access_token);
    pathOnDropbox = join(account.folder || "/", path);

    // We must lowercase this since localPath no longer
    // does and files for the Dropbox client are stored
    // in the folder with a lowercase path.
    pathOnBlot = localPath(blogID, path).toLowerCase();

    client
      .filesDelete({
        path: pathOnDropbox
      })

      // Respect any delay Dropbox would like before
      // potentially retry and requests
      .catch(waitForErrorTimeout)

      .catch(function(err) {
        // This means that error is something other
        // than the file not existing. HTTP 409 means
        // 'CONFLICT' but typically this means that
        // the file did not exist. Am I sure about this?
        if (err.status !== 409) throw new Error(err);

        // The file did not exist, no big deal
        return Promise.resolve();
      })
      .then(function() {
        return fs.remove(pathOnBlot);
      })
      .then(function() {
        callback(null);
      })
      .catch(function(err) {
        callback(err);
      });
  });
}

module.exports = retry(remove);
