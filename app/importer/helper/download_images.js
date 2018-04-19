var cheerio = require('cheerio');
var basename = require('path').basename;
var parse = require('url').parse;
var download = require('download-file');
var each_el = require('./each_el');

// Consider using this algorithm to determine best part of alt tag or caption to use
// as the file's name: 
// http://www.bearcave.com/misl/misl_tech/wavelets/compression/shannon.html

function download_thumbnail (thumbnail, path, callback) {

  if (!thumbnail) return callback();

  console.log('here', thumbnail, path);

  var name = nameFrom(thumbnail);

  download(thumbnail, {directory: path, filename: name}, function(err){

    if (err) return callback(err);

    return callback(null, name);
  });
}

module.exports = function download_images (post, callback) {

  var changes = false;
  var $ = cheerio.load(post.html, {decodeEntities: false});

  download_thumbnail(post.metadata.thumbnail, post.path, function(err, thumbnail){

    if (!err && thumbnail) {
      changes = true;
      post.metadata.thumbnail = thumbnail;
    }

    each_el($, 'img', function(el, next){

      var src = $(el).attr('src');

      if (!src || src.indexOf('data:') === 0)
        return next();

      var name = nameFrom(src);
      if (name.charAt(0) !== '_') name = '_' + name;

      download(src, {directory: post.path, filename: name}, function(err){

        if (err) {
          console.log('Image error', src, err);
          return next();
        }

        changes = true;

        $(el).attr('src', name);

        if ($(el).parent().attr('href') === src)
          $(el).parent().attr('href', name);

        next();
      });
    }, function(){

      if (changes) {
        post.path = post.path + '/post.txt';
      } else {
        post.path = post.path + '.txt';
      }

      post.html = $.html();

      callback(null, post);
    });
  });
};

function nameFrom (src) {
  return '_' + basename(parse(src).pathname);
}