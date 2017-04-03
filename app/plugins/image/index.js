var Transformer = require('../../transformer');

var each = require('../eachEl');
var config = require('../../../config');

var Url = require('url');
var optimize = require('./optimize');

var CDN_HOST = config.cdn.host;

if (!CDN_HOST) throw "Please specify config.cdn.host";

function render ($, callback, options) {

  var blogID = options.blogID;
  var cache = new Transformer(blogID, 'image-cache');

  each($, 'img', function(el, next){

    var src = $(el).attr('src');

    if (isBlot(src)) return next();

    cache.lookup(src, function(path, done){

      optimize(blogID, path, done);

    }, function(err, res){

      if (err) {
        console.log('CACHE:', src, err.message);
        return next();
      }

      if (!res.width || !res.url || !res.height)
        return next();

      // This is a retina image so half its dimensions
      // we don't store these halved dimensions...
      if ($(el).attr('data-2x') || isRetina(res.url)) {
        res.width /= 2;
        res.height /= 2;
      }

      $(el)
          .attr('width', res.width)
          .attr('height', res.height)
          .attr('src', res.url);

      next();
    });
  }, callback);
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
  description: 'Retrieve, specify dimensions, auto-rotate and optimize images on your blog.'
};