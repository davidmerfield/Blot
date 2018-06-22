var fs = require("fs-extra");
var Metadata = require("metadata");
var helper = require("helper");
var localPath = helper.localPath;
var basename = require("path").basename;

module.exports = function(blogID, path, options, callback) {
  if (callback === undefined && typeof options === "function") {
    callback = options;
    options = {};
  }

  var name = options.name || basename(path);

  Metadata.add(blogID, path, name, function(err) {
    if (err) return callback(err);

    fs.ensureDir(localPath(blogID, path), function(err) {
      if (err) return callback(err);

      callback();
    });
  });
};
