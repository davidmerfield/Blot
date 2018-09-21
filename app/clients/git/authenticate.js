var auth = require("http-auth");
var Blog = require("blog");
var database = require("./database");

module.exports = auth.connect(
  // Beware that req as fourth argument might not be reliable:
  // https://github.com/http-auth/http-auth/pull/67#issuecomment-244306701
  auth.basic({ realm: "Git" }, function(handle, token, callback, req) {
    // User is attempting to push or pull another user's repo
    if (handle !== req.params.gitHandle) {
      return callback(false);
    }

    Blog.get({ handle: handle }, function(err, blog) {
      // There is no blog with this handle
      if (err || !blog) {
        return callback(false);
      }

      database.checkToken(blog.id, token, function(err, valid) {
        callback(err === null && valid);
      });
    });
  })
);
