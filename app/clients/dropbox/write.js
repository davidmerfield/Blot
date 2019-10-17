var join = require("path").join;
var database = require("./database");
var debug = require("debug")("clients:dropbox:write");
var createClient = require("./util/createClient");
var fs = require("fs-extra");
var localPath = require("helper").localPath;
var retry = require("./util/retry");

// Write should only ever be called inside the function returned
// from Sync for a given blog, since it modifies the blog folder.
function write(blogID, path, contents, callback) {
  var pathInDropbox, client, pathOnBlot;

  debug("Blog:", blogID, "Writing", path);

  database.get(blogID, function(err, account) {
    if (err || !account) return callback(err || new Error("No account"));

    client = createClient(account.access_token);
    pathInDropbox = join(account.folder || "/", path);

    // We must lowercase this since localPath no longer
    // does and files for the Dropbox client are stored
    // in the folder with a lowercase path.
    pathOnBlot = localPath(blogID, path).toLowerCase();

    client
      .filesUpload({
        contents: contents,
        autorename: false,
        mode: { ".tag": "overwrite" },
        path: pathInDropbox
      })
      .then(function() {
        return fs.outputFile(pathOnBlot, contents);
      })
      .then(function() {
        callback(null);
      })
      .catch(function(err) {
        callback(err);
      });
  });
}

module.exports = retry(write);
