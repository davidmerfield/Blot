var helper = require("helper");
var ensure = helper.ensure;

var imagemin = require("imagemin");
var imageminPngquant = require("imagemin-pngquant");
var imageminZopfli = require("imagemin-zopfli");
var imageminMozjpeg = require("imagemin-mozjpeg"); //need to run 'brew install libpng'
var imageminGiflossy = require("imagemin-giflossy");

var dirname = require("path").dirname;

module.exports = function (path, callback) {
  console.log("minifying ", path);
  imagemin([path], {
    destination: require("path").dirname(path),
    plugins: [
      imageminPngquant({
        speed: 1,
        quality: [0.95, 1], //lossy settings
      }),
      imageminZopfli({
        more: true,
        iterations: 50, // very slow but more effective
      }),
      imageminGiflossy({
        optimizationLevel: 3,
        optimize: 3, //keep-empty: Preserve empty transparent frames
        lossy: 2,
      }),
      // imagemin.svgo({
      //   plugins: [
      //     {
      //       removeViewBox: false,
      //     },
      //   ],
      // }),
      //jpg lossless
      // imagemin.jpegtran({
      //   progressive: true,
      // }),
      //jpg very light lossy, use vs jpegtran
      imageminMozjpeg({
        quality: 90,
      }),
    ],
  }).then(function () {
    callback(null, path);
  });
};
