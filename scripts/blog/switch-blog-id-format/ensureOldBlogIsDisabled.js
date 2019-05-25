var Blog = require("blog");
var async = require("async");
var Sync = require("sync");
var colors = require("colors/safe");

module.exports = function(oldBlogID, newBlogID, callback) {
  var cleanupTasks = [];

  console.log(
    colors.dim("Blog: " + oldBlogID) + " Ensuring blog is disabled"
  );

  function renableOldBlog(callback) {
    console.log(colors.dim("Blog: " + oldBlogID) + " Re-enabling blog");

    async.parallel(cleanupTasks, callback);
  }

  Blog.get({ id: oldBlogID }, function(err, oldBlog) {
    if (err || !oldBlog || oldBlog.isDisabled)
      return callback(null, renableOldBlog);

    cleanupTasks.push(function(callback) {
      Blog.set(newBlogID, { isDisabled: false }, callback);
    });

    // This should fail if the blog is currently syncing
    Sync(oldBlogID, function(err, folder, done) {
      if (err) return callback(err);

      Blog.set(oldBlogID, { isDisabled: true }, function(err) {
        done(err, function(err) {
          callback(err, renableOldBlog);
        });
      });
    });
  });
};
