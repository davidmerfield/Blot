var fs = require("fs-extra");
var helper = require("helper");
var localPath = helper.localPath;
var Git = require("simple-git");
var debug = require("debug")("clients:git:write");
var checkGitRepoExists = require('./checkGitRepoExists');

// Used to write a file to the user's blog folder
// contents can be anything supported by fs-extra.outputFile
// which I believe includes buffers and utf8 strings.
module.exports = function write(blogID, path, contents, callback) {
  var git;

  checkGitRepoExists(blogID, function(err){
    if (err) return callback(err);

    fs.outputFile(localPath(blogID, path), contents, function(err) {
      if (err) return callback(err);

      git = Git(localPath(blogID, "/"));

      // Git does not like paths with leading slashes
      if (path[0] === "/") path = path.slice(1);

      // Could we queue these commands for better performance?
      git.add(path, function(err){

        // simple-git returns errors as strings
        if (err) return callback(new Error(err));

        git.commit("Updated " + path, function(err){

          if (err) return callback(new Error(err));
        
          // We push changes made to the bare repository
          git.push(function(err) {
          
            if (err) return callback(new Error(err));
        
            debug("Blog:", blogID, "Wrote", path);
            callback(null);
          });
        });
      });
    });
  });
};
