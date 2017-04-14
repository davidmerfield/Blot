var Blog = require('../../app/models/blog');
var eachBlog = require('../each/blog');

eachBlog(function(user, blog, next){

  if (blog.permalink.isCustom !== undefined) return next();

  blog.permalink.isCustom = blog.permalink.custom === blog.permalink.format;

  Blog.set(blog.id, blog, next);

}, process.exit);