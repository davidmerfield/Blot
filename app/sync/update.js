var fs = require("fs-extra");
var helper = require("helper");
var localPath = helper.localPath;

var drop = require("./drop");
var set = require("./set");
var mkdir = require("./mkdir");

module.exports = function(blog) {

  return function(path, options, callback) {
    
    if (callback === undefined && typeof options === "function") {
      callback = options;
      options = {};
    }

    function onComplete (err) {
      // we never let this error escape
      if (err) console.log('SYNC ERROR:', err);

      callback(null, {error: err || null});
    }

    fs.stat(localPath(blog.id, path), function(err, stat) {
      if (err && err.code === "ENOENT") {
        drop(blog.id, path, options, onComplete);
      } else if (err || !stat) {
        onComplete(err || new Error("No stat from " + path));
      } else if (stat.isDirectory()) {
        mkdir(blog.id, path, options, onComplete);
      } else if (stat.isFile()) {
        set(blog, path, options, onComplete);
      } else {
        onComplete(new Error("Not sure what to with stat", stat));
      }
    });
  };
};
