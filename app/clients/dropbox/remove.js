var debug = require("debug")("clients:dropbox:remove");
var createClient = require("./util/createClient");
var database = require("./database");
var join = require("path").join;
var fs = require('fs-extra');
var localPath = require('helper').localPath;

// This should only ever be called inside the function
// returned from Sync for a given blog, since it modifies
// the blog's folder. 

// Also, this doesn't handle multiple concurrent
// removes very well. We might want to add some sort of multi
// feature, or think about implementing a queue of some sort.
module.exports = function remove(blogID, path, callback) {
  var client, pathInDropbox;

  debug("Blog:", blogID, "Removing", path);

  database.get(blogID, function(err, account) {
    client = createClient(account.access_token);
    pathInDropbox = join(account.folder || "/", path);

    client
      .filesDelete({
        path: pathInDropbox
      })
      .then(function(){
        return fs.remove(localPath(blogID, path));
      })
      .then(function() {
        callback(null);
      })
      .catch(function(err) {
        // The file did not exist, no big deal
        if (err.status === 409) return callback(null);

        callback(err);
      });
  });
};
