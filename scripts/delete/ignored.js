var eachBlog = require("../each/blog");
var Ignored = require("models/ignoredFiles");

eachBlog(function (user, blog, nextBlog) {
  console.log("Emptying ignored files for", blog.handle);
  Ignored.flush(blog.id, nextBlog);
}, process.exit);
