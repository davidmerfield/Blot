var Blog = require('../../app/models/blog');
var eachBlog = require('../each/blog');

console.log('Fixing incorrect dateFormat:');

eachBlog(function(user, blog, next){

  if (blog.dateFormat !== 'M/D/Y') return next();

  console.log('-', blog.handle, blog.id);

  Blog.set(blog.id, {dateFormat: 'M/D/YYYY'}, next);

}, function(err){
  if (err) throw err;
  console.log('Fixed the date format for all blogs');
});