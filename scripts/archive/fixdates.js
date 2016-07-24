var options = require('minimist')(process.argv.slice(2));
var eachBlog = require('./each/blog');
var Blog = require('../app/models/blog');

eachBlog(function (user, blog, next) {

  console.log(blog.handle, blog.dateDisplay);

  if (blog.dateDisplay.indexOf('YYYY') === -1)
    return next();

  var from = blog.dateDisplay;
  var dateDisplay = blog.dateDisplay;

  dateDisplay = dateDisplay.split('YYYY').join('Y');

  Blog.set(blog.id, {dateDisplay: dateDisplay}, function(err){

    if (err) throw err;

    console.log(from, '->', dateDisplay);

    return next();
  });

}, process.exit, options);
