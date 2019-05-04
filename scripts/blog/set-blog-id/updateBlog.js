var Blog = require("blog");
var debug = require("debug")("blot:scripts:set-blog-id:updateBlog");

module.exports = function updateBlog(oldBlog, newBlogID, callback) {
  debug("Saving new ID as property of blog", newBlogID);

  var changes = { id: newBlogID };
  
  if (oldBlog.template.indexOf(oldBlog.id + ":") === 0)
    changes.template = oldBlog.template
      .split(oldBlog.id + ":")
      .join(newBlogID + ":");
      
  Blog.set(newBlogID, changes, callback);
};
