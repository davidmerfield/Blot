var helper = require("helper");
var localPath = helper.localPath;
var fs = require("fs-extra");
var build = require("./build");
var mkdir = require("./mkdir");
var remove = require("./remove");

module.exports = function(blog) {
  return function(path, options, callback) {
    if (callback === undefined && typeof options === "function") {
      callback = options;
      options = {};
    }

    fs.stat(localPath(blog.id, path), function(err, stat) {
      
      if (err && err.code !== "ENOENT") return callback(err);

      if (err && err.code === "ENOENT") return remove(blog)(path, options, callback);

      if (stat.isDirectory()) return mkdir(blog)(path, options, callback);

      build(blog, path, options, callback);
    });
  };
};
