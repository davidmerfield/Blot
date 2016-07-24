var options = require('minimist')(process.argv.slice(2));
var rebuild = require('../app/rebuild/main');
var eachBlog = require('./each/blog');
var Transformer = require('../app/transformer');

eachBlog(function (user, blog, next) {

  rebuild(blog.id, function(err){

    if (err) throw err;

    next();
  });
}, process.exit, options);
