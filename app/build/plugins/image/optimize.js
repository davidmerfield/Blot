var config = require("config");
var uuid = require("uuid/v4");
var join = require("path").join;
var fs = require("fs-extra");
// e.g. /_image_cache/{uuid}.jpg will be final URL
var cache_folder_name = "_image_cache";
var fs = require("fs-extra");
var resize = require("./resize");
var minify = require("./minify");
var extname = require("path").extname;
var uuid = require("uuid/v4");
var join = require("path").join;
var debug = require("debug")("entry:build:plugins:image");

module.exports = function(blogID) {
  return function(path, _callback) {
    // Extnames can sometimes be uppercase, we want to ensure that
    // this will work on case-sensitive file systems so we lowercase it...
    var name = uuid() + extname(path).toLowerCase();
    var finalPath = join(
      config.blog_static_files_dir,
      blogID,
      cache_folder_name,
      name
    );
    var src =
      "https://" +
      config.cdn.host +
      "/" +
      blogID +
      "/" +
      cache_folder_name +
      "/" +
      name;

    // Wrap callback to clean up file if we encounter an error in this module
    // When transformer creates and cleans up a tmp file for us, can remove this.
    var callback = function(err, info) {
      if (!err) return _callback(null, info);

      fs.remove(finalPath, function() {
        _callback(err, info);
      });
    };

    debug("Copying", path, "to", finalPath);
    fs.copy(path, finalPath, function(err) {
      if (err) return callback(err);

      debug("Resizing", finalPath);
      resize(finalPath, function(err, info) {
        if (err) return callback(err);

        if (!info.width || !info.height)
          return callback(new Error("No width or height"));

        debug("Minifying", finalPath);
        // minify(finalPath, function(err){

        if (err) return callback(err);

        info.src = src;

        callback(null, info);
        // });
      });
    });
  };
};
