var imagemin = require("imagemin");
var mozjpeg = require("imagemin-mozjpeg");
var pngquant = require("imagemin-pngquant");
var jpegrecompress = require("imagemin-jpeg-recompress");

// We must assume that the file names
// have been normalized and have lowercase
// file extensions... or not!
var MATCH = "/*.{jpg,jpeg,png,JPG,JPEG,PNG}";

function main(dir, callback) {
  imagemin([dir + MATCH], dir, {
    plugins: [
      pngquant({ quality: 85, speed: 1 }),
      mozjpeg({ quality: 85 }),
      jpegrecompress()
    ]
  })
    .then(function() {
      callback();
    })
    .catch(function(err) {
      if (err) console.log(err);

      callback();
    });
}

module.exports = main;
