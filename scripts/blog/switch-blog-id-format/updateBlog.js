var Blog = require("blog");
var debug = require("debug")("blot:scripts:set-blog-id:updateBlog");

module.exports = function updateBlog(oldBlogID, newBlogID, callback) {
  debug("Updating property of blogs with new ID", newBlogID);

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
