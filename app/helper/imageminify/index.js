const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const imageminZopfli = require("imagemin-zopfli");
const imageminMozjpeg = require("imagemin-mozjpeg"); //need to run 'brew install libpng'
const imageminGiflossy = require("imagemin-giflossy");

const dirname = require("path").dirname;

module.exports = function (path, callback) {
  imagemin([path], {
    destination: dirname(path),
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
