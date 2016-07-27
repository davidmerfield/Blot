var imagemin = require('imagemin');
var mozjpeg = require('imagemin-mozjpeg');
var pngquant = require('imagemin-pngquant');
var jpegrecompress = require('imagemin-jpeg-recompress');
var is = require('./_is');
var dirname = require('path').dirname;

function images (source, output, callback) {

  imagemin([source], dirname(output), {
    plugins: [
      pngquant({quality: 90, speed: 1}),
      mozjpeg({quality: 90}),
      jpegrecompress()
    ]
  }).then(function () {

    callback();

  }).catch(function(err){

    callback(err);
  });

}

images.is = is('.jpg', '.jpeg', '.png');

module.exports = images;