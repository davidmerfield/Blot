var join = require("path").join;
var database = require("./database");
var debug = require("debug")("clients:dropbox:write");
var createClient = require("./util/createClient");
var fs = require('fs-extra');
var localPath = require('helper').localPath;

// This should only ever be called inside the function
// returned from Sync for a given blog, since it modifies
// the blog's folder. 

// Also, this doesn't handle multiple concurrent
// writes very well. We might want to add some sort of multi
// feature, or think about implementing a queue of some sort? Perhaps
// just implement retry with jitter.
module.exports = function write(blogID, path, contents, callback) {
  var pathInDropbox, client;

  debug("Writing to", path);

  database.get(blogID, function(err, account) {
    if (err || !account) return callback(err || new Error("No account"));

    pathInDropbox = join(account.folder || "/", path);
    client = createClient(account.access_token);

    client
      .filesUpload({
        contents: contents,
        autorename: false,
        mode: { ".tag": "overwrite" },
        path: pathInDropbox
      })
      .then(function(){
        return fs.outputFile(localPath(blogID, path), contents);
      })
      .then(function() {
        callback(null);
      })
      .catch(function(err) {
        callback(err);
      });
  });
};
