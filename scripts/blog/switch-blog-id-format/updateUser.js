var User = require("user");
var async = require("async");
var colors = require("colors/safe");

module.exports = function updateUser(oldBlogID, newBlogID, callback) {
  console.log(colors.dim("Blog: " + oldBlogID) + " Updating property of owner");
  User.getAllIds(function(err, uids) {
    async.each(
      uids,
      function(uid, next) {
        User.getById(uid, function(err, user) {
          if (err || !user) return next(err);

          var changes = {};

          if (user.blogs.indexOf(oldBlogID) > -1) {
            changes.blogs = user.blogs.filter(function(id) {
              return id !== oldBlogID;
            });
            changes.blogs.push(newBlogID);
          }

          if (user.lastSession === oldBlogID) {
            changes.lastSession = newBlogID;
          }

          if (!Object.keys(changes).length) return next();

          User.set(uid, changes, next);
        });
      },
      callback
    );
  });
};
