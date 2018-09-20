var fs = require("fs-extra");
var helper = require("helper");
var localPath = helper.localPath;
var Git = require("simple-git");
var debug = require("debug")("client:git");

// Used to write a file to the user's blog folder
// contents can be anything supported by fs-extra.outputFile
// which I believe includes buffers and utf8 strings.
module.exports = function write(blogID, path, contents, callback) {
  var git;

  fs.outputFile(localPath(blogID, path), contents, function(err) {
    if (err) return callback(err);

    git = Git(localPath(blogID, "/"));

    // Git does not like paths with leading slashes
    if (path[0] === "/") path = path.slice(1);

    git.add(path).commit("Updated " + path);

    git.push(function(err) {
      if (err) return callback(err);

      debug("Blog:", blogID, "Successfully wrote", path);
      callback();
    });
  });
};
