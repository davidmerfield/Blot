var Transformer = require('helper').transformer;
var debug = require('debug')('entry:build:plugins:image');
var eachEl = require('../eachEl');
var config = require('config');
var optimize = require('./optimize');
var uuid = require("uuid/v4");
var join = require('path').join;
var fs = require('fs-extra');

// e.g. /_image_cache/{uuid}.jpg will be final URL
var cache_folder_name = '_image_cache';

function render ($, callback, options) {

  var blogID = options.blogID;
  var cache = new Transformer(blogID, 'image-cache');

  // Process 5 images concurrently
  eachEl($, 'img', function(el, next){

    var src = $(el).attr('src');

    debug(src, 'checking cache');

    cache.lookup(src, optimize, function(err, info){

      if (err) {
        debug(src, 'Optimize failed with Error:', err);
        return next();
      }

      var name = uuid() + '.' + info.format;
      var finalPath = join(config.blog_static_files_dir, blogID, cache_folder_name, name);

      debug('Moving', info.path, finalPath);
      
      fs.move(info.path, finalPath, function(err){

        if (err) return next();

        var width, height, src;

        if (err) {
          debug(src, 'ERROR');
          debug(err);
          return next();
        }

        src = '/' + cache_folder_name + '/' + name;

        if (!info.width || !info.height) {
          debug(src, 'Result has no width, height or url property');
          debug(info);
          return next();
        }


        if ($(el).attr('width') || $(el).attr('height')) {
          debug(src, 'El has width or height pre-specified dont modify');
          debug(info);
          return next();
        }

        debug(src, 'modifying parent element');

        width = info.width;
        height = info.height;
   
        // This is a retina image so half its dimensions
        // we don't store these halved dimensions...
        if ($(el).attr('data-2x') || isRetina(src)) {
          debug(src, 'retinafying the dimensions');
          height /= 2;
          width /= 2;
        }

        $(el)
            .attr('width', width)
            .attr('height', height)
            .attr('src', src);

        debug(src, 'complete!');
        next();
      });
    });
  }, function(){
    debug('Invoking callback now!');
    callback();
  });
}

function isRetina (url) {
  return url && url.toLowerCase && url.toLowerCase().indexOf('@2x') > -1;
}


module.exports = {
  render: render,
  category: 'images',
  title: 'Cache',
  description: 'Cache and optimize images'
};