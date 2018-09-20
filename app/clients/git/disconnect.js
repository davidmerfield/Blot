var fs = require("fs-extra");
var helper = require("helper");
var localPath = helper.localPath;
var Blog = require("blog");
var debug = require("debug")("client:git");

// Called when the user disconnects the client
// This may occur when the
module.exports = function disconnect (blogID, callback) {
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
        fs.remove(localPath(blogID, "/.git"), function(err) {
          if (err) return callback(err);

          callback();
        });
      });
    });
  });
};