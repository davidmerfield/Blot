var Blog = require("blog");
var debug = require("debug")("blot:scripts:set-blog-id:updateBlog");

module.exports = function updateBlog(newBlogID, callback) {
  debug("Saving new ID as property of blog", newBlogID);
  Blog.set(newBlogID, { id: newBlogID }, callback);
};
