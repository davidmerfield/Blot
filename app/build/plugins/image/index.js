var Transformer = require('helper').transformer;
var debug = require('debug')('entry:build:plugins:image');
var eachEl = require('../eachEl');
var optimize = require('./optimize');
var url = require('url');
var decodeAmpersands = require('helper').decodeAmpersands;

function render ($, callback, options) {

  var blogID = options.blogID;
  var cache = new Transformer(blogID, 'image-cache');

  // Process 5 images concurrently
  eachEl($, 'img', function(el, next){

    // Decode any doubly-encoded ampersands in the image src
    var src = decodeAmpersands($(el).attr('src'));
    var width, height;

    // Test for query string to skip caching & optimizing
    var parsedSrc = url.parse(src, { parseQueryString: true });
    debug(src, 'is parsed into', parsedSrc)

    if (parsedSrc.query.static) {
      debug(src, 'Image has \'static\' URL param, skipping');
      return next();
    }

    // No URL params or hash values
    var cleanSrc = origin(parsedSrc) + parsedSrc.pathname;
    debug(src, 'is cleaned into', cleanSrc);

    debug(cleanSrc, 'checking cache');

    // Pass in the `pathname` component of the image src (no URL params or hash)
    cache.lookup(cleanSrc, optimize(blogID), function(err, info){

      if (err) {
        debug(cleanSrc, 'Optimize failed with Error:', err);
        return next();
      }

      // Replace the image's source with the new
      // source, which is a path to an image in the
      // static assets folder for this blog.
      $(el).attr('src', info.src);

      // Now we will attempt to declare the width and
      // height of the image to speed up page loads...
      if ($(el).attr('width') || $(el).attr('height')) {
        debug(cleanSrc, 'El has width or height pre-specified dont modify');
        return next();
      }

      width = info.width;
      height = info.height;

      // This is a retina image so halve its dimensions
      if ($(el).attr('data-2x') || isRetina(cleanSrc)) {
        debug(cleanSrc, 'retinafying the dimensions');
        height /= 2;
        width /= 2;
      }

      $(el).attr('width', width).attr('height', height);

      debug(cleanSrc, 'complete!');
      next();
    });
  }, function(){
    debug('Invoking callback now!');
    callback();
  });
}

function isRetina (url) {
  return url && url.toLowerCase && url.toLowerCase().indexOf('@2x') > -1;
}

// Legacy URL API doesn't have an `origin` property
// Assuming both `protocol` and `hostname` exist, create it
// Otherwise return empty string
function origin (url) {
  if (url.protocol && url.hostname)
    return url.protocol + "//" + url.hostname;
  return "";
}

module.exports = {
  render: render,
  category: 'images',
  title: 'Cache',
  description: 'Cache and optimize images'
};
