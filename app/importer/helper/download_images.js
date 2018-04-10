var cheerio = require('cheerio');
var basename = require('path').basename;
var parse = require('url').parse;
var download = require('download-file');
var each_el = require('./each_el');

// Consider using this algorithm to determine best part of alt tag or caption to use
// as the file's name: 
// http://www.bearcave.com/misl/misl_tech/wavelets/compression/shannon.html

module.exports = function download_images (content, parent_folder, callback) {

  var changes = false;
  var $ = cheerio.load(content, {decodeEntities: false});

  each_el($, 'img', function(el, next){

    var src = $(el).attr('src');

    if (!src || src.indexOf('data:') === 0)
      return next();

    var name = nameFrom(src);
    if (name.charAt(0) !== '_') name = '_' + name;

    download(src, {directory: parent_folder, filename: name}, function(err){

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

    callback(null, $.html(), changes);
  });
};

function nameFrom (src) {
  return '_' + basename(parse(src).pathname);
}