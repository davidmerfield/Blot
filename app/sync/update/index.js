var fs = require("fs-extra");
var helper = require("helper");
var localPath = helper.localPath;
var async = require("async");

var drop = require("./drop");
var set = require("./set");
var mkdir = require("./mkdir");

module.exports = function(blog) {
  return function(path, options, callback) {
    if (callback === undefined && typeof options === "function") {
      callback = options;
      options = {};
    }

    fs.stat(localPath(blog.id, path), function(err, stat) {
      if (err && err.code === "ENOENT") {
        drop(blog.id, path, options, callback);
      } else if (err || !stat) {
        callback(err || new Error("No stat from " + path));
      } else if (stat.isDirectory()) {
        mkdir(blog.id, path, options, callback);
      } else if (stat.isFile()) {
        set(blog, path, options, callback);
      } else {
        callback(new Error("Not sure what to with stat", stat));
      }
    });
  };
};
