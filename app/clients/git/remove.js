var fs = require("fs-extra");
var helper = require("helper");
var localPath = helper.localPath;
var Git = require("simple-git");
var debug = require("debug")("client:git");

// This should probably copy the file to a
// temporary location so the removal can be
// rolled back if we encounter an error
module.exports = function remove(blogID, path, contents, callback) {
  var git;

  fs.remove(localPath(blogID, path), contents, function(err) {
    if (err) return callback(err);

    git = Git(localPath(blogID, "/"));

    // Git does not like paths with leading slashes
    if (path[0] === "/") path = path.slice(1);

    git.add(path).commit("Removed " + path);

    // We push changes made to the bare repository in
    // data/clients/git/{blogID}
    git.push(function(err) {
      if (err) return callback(err);

      debug("Blog:", blogID, "Successfully removed", path);
      callback();
    });
  });
};
