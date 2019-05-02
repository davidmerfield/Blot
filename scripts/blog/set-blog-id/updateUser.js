var debug = require("debug")("blot:scripts:set-blog-id:updateUser");
var User = require("user");

module.exports = function updateUser(uid, oldBlogID, newBlogID, callback) {
  debug("Retrieving user", uid);
  User.getById(uid, function(err, user) {
    if (err) return callback(err);

    if (!user) return callback(new Error("No user: " + uid));

    debug("Old list of blogs:", user.blogs);
    user.blogs = user.blogs.filter(function(id) {
      return id !== oldBlogID;
    });

    user.blogs.push(newBlogID);
    debug("New list of blogs:", user.blogs);

    User.set(user.uid, user, callback);
  });
};