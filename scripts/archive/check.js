var forEach = require('../app/helper/forEach');
var eachView = require('./each/view');
var eachBlog = require('./each/blog');
var eachEntry = require('./each/entry');

var bad = [
  'd1pz8las0acjgp.cloudfront.net', // blot-js
  'd1hzoodlovk6y5.cloudfront.net', // blot-dump
  'd1u95qvrdsh2gl.cloudfront.net', // blot-images
  'd2fbk5uwlkue7.cloudfront.net', // blotimages
  'd2li76csayfw3k.cloudfront.net', // blot-css
  'images.blot.im',
  'blot-js.s3.amazonaws.com',
  'blotimages.s3.amazonaws.com',
  'blot-images.s3.amazonaws.com',
  'blot-css.s3.amazonaws.com',
  'blot-blogs.s3.amazonaws.com'
];

function tainted (val) {

  val = val.toString();

  for (var x = 0; x < bad.length;x++)
    if (val.indexOf(bad[x]) > -1)
      return bad[x];

  return false;
}

eachBlog(function(user, blog, nextBlog){

  forEach(blog, function(key, value, next){

    if (tainted(value)) {
      console.log(blog.id, key, 'has', tainted(value));
      throw '';
    }

    next();

  }, nextBlog);

}, function(){

  eachView(function(user, blog, template, view, nextView){

    forEach(view, function(key, value, next){

      if (tainted(value)) {
        console.log(blog.id, template.id, view.name, key, 'has', tainted(value));
        throw '';
      }

      next();

    }, nextView);

  }, function(){

    eachEntry(function(user, blog, entry, nextEntry){

      forEach(entry, function(key, value, next){

        if (entry.deleted) return next();

        if (tainted(value)) {
          console.log(blog.id, entry.id, key, 'has', tainted(value));
        }

        next();

      }, nextEntry);

    }, process.exit);
  });
});

