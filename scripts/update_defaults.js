var eachBlog = require('./each/blog');
var Blog = require('../app/models/blog');

eachBlog(function (user, blog, nextBlog) {

  if (blog.forceSSL === undefined || blog.forceSSL === null)
    blog.forceSSL = false;

  console.log(blog.id, blog.title, blog.forceSSL);

  Blog.set(blog.id, blog, nextBlog);

}, process.exit)