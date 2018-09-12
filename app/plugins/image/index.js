var Transformer = require('../../transformer');
var debug = require('debug')('entry:build:plugins:image');
var eachEl = require('../eachEl');
var config = require('../../../config');
var Url = require('url');
var optimize = require('./optimize');
var CDN_HOST = config.cdn.host;

if (!CDN_HOST) throw new Error("Please specify config.cdn.host");

function render ($, callback, options) {

  var blogID = options.blogID;
  var cache = new Transformer(blogID, 'image-cache');

  // Process 5 images concurrently
  eachEl($, 'img', function(el, next){

    var src = $(el).attr('src');

    debug(src, 'found image');

    if (isBlot(src)) {
      debug(src, 'is on Blot CDN');
      return next();
    }

    debug(src, 'checking cache for this image');
    cache.lookup(src, function(path, done){

      debug(src, 'cache miss, optimizing image now...');
      optimize(blogID, path, done);

    }, function(err, res){

      var width, height;

      if (err) {
        debug(src, 'ERROR');
        debug(err);
        return next();
      }

      if (!res.width || !res.url || !res.height) {
        debug(src, 'Result has no width, height or url property');
        debug(res);
        return next();
      }


      if ($(el).attr('width') || $(el).attr('height')) {
        debug(src, 'El has width or height pre-specified dont modify');
        debug(res);
        return next();
      }

      debug(src, 'modifying parent element');

      width = res.width;
      height = res.height;
 
      // This is a retina image so half its dimensions
      // we don't store these halved dimensions...
      if ($(el).attr('data-2x') || isRetina(res.url)) {
        debug(src, 'retinafying the dimensions');
        height /= 2;
        width /= 2;
      }

      $(el)
          .attr('width', width)
          .attr('height', height)
          .attr('src', res.url);

      debug(src, 'complete!');
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

function isBlot (url) {

  var host;

  try {
    host = Url.parse(url).host;
  } catch (e) {
    return false;
  }

  if (!host) return false;

  return host.slice(-CDN_HOST.length) === CDN_HOST;
}

module.exports = {
  render: render,
  category: 'images',
  title: 'Cache',
  description: 'Cache and optimize images'
};