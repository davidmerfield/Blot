var helper = require("helper");
var localPath = helper.localPath;
var fs = require("fs-extra");
var build = require("./build");

module.exports = function(blog) {
  return function(tmpPath, path, options, callback) {
    if (callback === undefined && typeof options === "function") {
      callback = options;
      options = {};
    }

    fs.move(tmpPath, localPath(blog.id, path), function(err) {
      
      if (err) return callback(err);

      build(blog, path, options, callback);
    });
  };
};
