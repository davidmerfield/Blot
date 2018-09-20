var debug = require("debug")("client:git");
var fs = require("fs-extra");
var Git = require("simple-git");
var helper = require("helper");
var TEMP_DIR = helper.tempDir();
var UID = helper.makeUid;
var join = require("path").join;
var basename = require("path").basename;
var Blog = require("blog");
var localPath = helper.localPath;
var REPO_DIR = __dirname + "/data";

module.exports = {
  // Used to write a file to the user's blog folder
  // contents can be anything supported by fs-extra.outputFile
  // which I believe includes buffers and utf8 strings.
  write: function(blogID, path, contents, callback) {
    var git;

    fs.outputFile(localPath(blogID, path), contents, function(err) {
      if (err) return callback(err);

      git = Git(localPath(blogID, "/"));

      if (path[0] === "/") path = path.slice(1);

      git.add(path).commit("Updated " + path);

      git.push(function(err) {
        if (err) return callback(err);

        debug("Blog:", blogID, "Successfully wrote", path);
        callback();
      });
    });
  },

  // Called when the user disconnects the client
  // This may occur when the
  disconnect: function(blogID, callback) {
    Blog.get({ id: blogID }, function(err, blog) {
      if (err || !blog) {
        return callback(err || new Error("No blog"));
      }

      Blog.set(blogID, { client: "" }, function(err) {
        if (err) return callback(err);

        // Remove the git repo in /repos
        fs.remove(REPO_DIR + "/" + blog.handle + ".git", function(err) {
          if (err) return callback(err);

          // Remove the .git directory in the user's blog folder
          fs.remove(blog_dir(blogID) + "/.git", function(err) {
            if (err) return callback(err);

            callback();
          });
        });
      });
    });
  },

  // This should probably copy the file to a
  // temporary location so the removal can be
  // rolled back if we encounter an error
  // when committing
  remove: function(blogID, path, callback) {
    if (path[0] === "/") path = path.slice(1);

    var git = Git(blog_dir(blogID));
    var message = "Removed " + path;
    var temporary_path = join(
      TEMP_DIR,
      Date.now() + "-" + UID(12),
      basename(path)
    );

    debug("Blog:", blogID, "Attempting to remove", path);
    fs.move(join(blog_dir(blogID), path), temporary_path, function(err) {
      if (err) return callback(err);

      debug("Blog:", blogID, "Attempting to add, commit and push", path);

      git
        .add(path)
        .commit(message)
        .push(function(err) {
          if (!err) {
            fs.remove(temporary_path, function() {
              debug("Blog:", blogID, "Successfully removed", path);
              callback();
            });
            return;
          }

          if (err) {
            fs.move(temporary_path, join(blog_dir(blogID), path), function() {
              callback(err);
            });
          }
        });
    });
  }
};
