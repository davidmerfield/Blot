var User = require("../../app/models/user");
var fromBlog = require("./blog");

// Takes a URL or handle and fetches the blog and user
module.exports = function get(identifier, callback) {
  fromBlog(identifier, function(err, user, blog) {
      if (user) return callback(null, user);
    User.getById(identifier, function(err, user) {
      if (user) return callback(null, user);
      User.getByCustomerId(identifier, function(err, user) {
        if (user) return callback(null, user);
        User.getByEmail(identifier, function(err, user) {
          if (user) return callback(null, user);
          callback(new Error("User not found: " + identifier));
        });
      });
    });
  });
};
