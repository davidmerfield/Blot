var Blog = require("blog");

module.exports = function loadBlog(oldBlogID, newBlogID, callback) {
  Blog.get({ id: oldBlogID }, function(err, oldBlog) {
    if (err) return callback(err);

    if (!oldBlog) return callback(new Error("No blog with ID: " + oldBlogID));

    Blog.get({ id: newBlogID }, function(err, existingBlog) {
      if (err) return callback(err);

      // We might want to be able to clobber and existing blog though...
      if (existingBlog)
        return callback(new Error("Existing blog with ID: " + existingBlog));

      callback(null, oldBlog);
    });
  });
};
