var Blog = require('../../app/models/blog');
var eachBlog = require('../each/blog');

eachBlog(function(user, blog, next){

  if (blog.permalink) return next();

  blog.permalink = {
    format: '{{slug}}',
    custom: ''
  };

  Blog.set(blog.id, blog, next);

}, process.exit);