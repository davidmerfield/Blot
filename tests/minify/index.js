var imagemin = require('imagemin');
var mozjpeg = require('imagemin-mozjpeg');
var pngquant = require('imagemin-pngquant');
var jpegrecompress = require('imagemin-jpeg-recompress');

var MATCH = '/*.{jpg,jpeg,png,JPG,JPEG,PNG}';

var input = __dirname + '/input';
var output = __dirname + '/output';

var fs = require('fs');
var helper = require('../../app/helper');

var forEach = helper.forEach;
// var copyFile = helper.copyFile;
// var localPath = helper.localPath;

var thumbnail = require('../../app/thumbnail/transform');

fs.readdir(input, function(err, names){

  if (err) throw err;

  forEach(names, function(name, next){

    console.log(name);

    if (name[0] === '.') return next();

    var outputdir = output + '/' + name;

    try {
      fs.mkdirSync(outputdir);
    } catch (e) {
      if (e.code!== 'EEXIST') throw e;
    }

    thumbnail(input + '/' + name, outputdir, function(err){

      if (err) throw err;

      console.log(name, 'made thumbnails! Now minifying...');

      imagemin([outputdir + MATCH], outputdir, {
        plugins: [pngquant({quality: 85, speed: 1}), mozjpeg({quality: 85}), jpegrecompress()]
      }).then(function () {

        console.log(name, 'Done minifying!');
        next();
      });
    });
  });
});

