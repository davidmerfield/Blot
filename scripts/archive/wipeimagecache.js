var options = require('minimist')(process.argv.slice(2));
var eachBlog = require('./each/blog');
var Transformer = require('../app/transformer');

eachBlog(function (user, blog, next) {

  var imageCache = new Transformer(blog.id, 'image-cache');
  var thumbnails = new Transformer(blog.id, 'thumbnails');

  imageCache.flush(function(){

    thumbnails.flush(function(){

      console.log(blog.id, blog.handle, 'flushed');

      next();
    });
  });
}, process.exit, options);
