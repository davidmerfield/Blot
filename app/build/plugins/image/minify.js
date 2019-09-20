var helper = require("helper");
var ensure = helper.ensure;

var imagemin = require("imagemin");
var mozjpeg = require("imagemin-mozjpeg");
var pngquant = require("imagemin-pngquant");
var jpegrecompress = require("imagemin-jpeg-recompress");
var dirname = require("path").dirname;

module.exports = function(path, callback) {
  ensure(path, "string").and(callback, "function");

  // I don't know how errors with this
  // plugin are handled...
  imagemin([path], dirname(path), {
    plugins: [
      pngquant({ quality: 95, speed: 1 }),
      mozjpeg({ quality: 95 }),
      jpegrecompress()
    ]
  }).then(function() {
    callback(null, path);
  });
};
