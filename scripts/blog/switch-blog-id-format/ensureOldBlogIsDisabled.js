var Blog = require("blog");
var async = require("async");

module.exports = function(oldBlogID, newBlogID, callback) {
  var cleanupTasks = [];

  function renableOldBlog(callback) {
    async.parallel(cleanupTasks, callback);
  }

  Blog.get({ id: oldBlogID }, function(err, oldBlog) {
    if (err || !oldBlog || oldBlog.isDisabled) return callback(null, renableOldBlog);

    cleanupTasks.push(function(callback) {
      Blog.set(newBlogID, { isDisabled: false }, callback);
    });

    Blog.set(oldBlogID, { isDisabled: true }, function(err) {
      if (err) return callback(err);

      callback(null, renableOldBlog);
    });
  });
};
