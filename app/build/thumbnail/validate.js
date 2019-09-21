var sharp = require("sharp");
var config = require("./config");
var FORMATS = config.FORMATS;
var MIN_WIDTH = config.MIN_WIDTH;
var MIN_HEIGHT = config.MIN_HEIGHT;

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

module.exports = function(path, callback) {
  var image = sharp(path);

  image.metadata(function(err, info) {
    if (err) return callback(err);

    if (!info) return callback(new Error("Could not read file info"));

    var format = info.format.toLowerCase();
    var width = info.width;
    var height = info.height;

    if (FORMATS.indexOf(format) === -1)
      return callback(
        new Error("Image (" + format + ") is not a supported format")
      );

    if (width < MIN_WIDTH)
      return callback(new Error("Image (" + width + "px wide) is too small"));

    if (height < MIN_HEIGHT)
      return callback(new Error("Image (" + height + "px tall) is too small"));

    callback();
  });
};
