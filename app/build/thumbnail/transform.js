var helper = require("helper");
var callOnce = helper.callOnce;
var basename = require("path").basename;
var async = require("async");
var fs = require("fs-extra");
var sharp = require("sharp");

// https://github.com/lovell/sharp/issues/138
// sharp.concurrency(2);
// Not sure why I commented this out? Shit
// https://github.com/lovell/sharp/issues/349
// https://github.com/lovell/sharp/issues/315
// sharp.cache(false);
// Sharp seems to cache files based on their
// path and not the contents of the file at
// a particular path. It was returning stale
// versions of a file in the blog's folder.
// Perhaps it might be smarter to copy the file
// to the temporary directory before operating on it?
// It's also possible that this is a bug in Sharp's
// caching that has been fixed in a more recent version
// or that still needs to be fixed. I should investigate.
sharp.cache(false);

var thumbnails = {
  small: { size: 160 },
  medium: { size: 640 },
  large: { size: 1060 },
  square: { size: 160, crop: true }
};

function main(path, outputDirectory, callback) {
  var read, input, result;

  callback = callOnce(callback);
  read = fs.createReadStream(path);
  input = sharp();
  result = {};

  read.on("error", callback);
  read.pipe(input);

  async.eachOf(
    thumbnails,
    function(options, name, next) {
      
      // We want to ensure that this will work on case-sensitive
      // file systems so we lowercase it...
      var fileName = name + "-" + basename(path).toLowerCase();
      var to = outputDirectory + '/' + fileName;

      transform(input, to, options, function(err, width, height) {
        if (err) return next(err);

        result[name] = {
          width: width,
          height: height,
          name: fileName
        };

        next();
      });
    },
    function(err) {
      callback(err, result);
    }
  );
}

function transform(input, to, options, callback) {
  var size = options.size;

  var transform = input
    .clone()
    .withoutEnlargement()
    .rotate(); // try to auto rotate
  // we need to reset quality
  // .quality(100); // don't compress, we'll do that later
  // need to update vips
  // .trellisQuantisation()

  // doesnt seem to do anything
  // .compressionLevel(9)

  transform.on("error", callback);

  transform.resize(size, size);

  if (options.crop) {
    transform.crop(sharp.strategy.entropy);
  } else {
    transform.max();
  }

  transform.toFile(to, function done(err, info) {
    if (err) return callback(err);

    callback(err, info.width, info.height);
  });
}

module.exports = main;
