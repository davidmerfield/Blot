var auth = require("http-auth");
var Blog = require("blog");
var database = require('./database');

module.exports = auth.connect(
  auth.basic({ realm: "Git" }, function(handle, token, callback) {

    Blog.get({ handle: handle }, function(err, blog) {
      if (err || !blog) {
        return callback(false);
      }

      database.check_token(blog.id, token, function(err, valid) {
        callback(err === null && valid);
      });
    });
  })
);
