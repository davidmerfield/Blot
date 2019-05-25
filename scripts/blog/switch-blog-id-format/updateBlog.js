var Blog = require("blog");
var colors = require("colors/safe");

module.exports = function updateBlog(oldBlogID, newBlogID, callback) {
  console.log(
    colors.dim("Blog: " + oldBlogID) + " Updating property of blogs with new ID"
  );

  Blog.get({ id: newBlogID }, function(err, blog) {
    var changes = {};

    if (blog.id === oldBlogID) changes.id = newBlogID;

    if (blog.template.indexOf(oldBlogID + ":") === 0)
      changes.template = blog.template
        .split(oldBlogID + ":")
        .join(newBlogID + ":");

    Blog.set(newBlogID, changes, callback);
  });
};
