var sharp = require("sharp");
var config = require("./config");
var FORMATS = config.FORMATS;
var MIN_WIDTH = config.MIN_WIDTH;
var MIN_HEIGHT = config.MIN_HEIGHT;
var debug = require("debug")("blot:entry:build:thumbnail:validate");

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

module.exports = function (path, callback) {
  var format, width, height;

  debug(path);
  sharp(path).metadata(function (err, info) {
    if (err) return callback(err);

    if (!info) {
      err = new Error("Could not read file info");
      return callback(err);
    }

    debug(path, info);
    format = info.format.toLowerCase();
    width = info.width;
    height = info.height;

    if (FORMATS.indexOf(format) === -1) {
      err = new Error("Image (" + format + ") is not a supported format");
      return callback(err);
    }

    if (width < MIN_WIDTH) {
      err = new Error("Image (" + width + "px wide) is too small");
      return callback(err);
    }

    if (height < MIN_HEIGHT) {
      err = new Error("Image (" + height + "px tall) is too small");
      return callback(err);
    }

    debug(path, "is valid");
    callback();
  });
};
