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

    // Blot likes leading slashes, the git client
    // for instance does not have them but we
    // are not so strict above these things...
    if (path[0] !== "/") path = "/" + path;

    function done (err) {
      // we never let this error escape out
      if (err) {
        console.error("Blog", blog.id, "Caught error updating", path, err);
      }
      callback(null, { error: err || null });
    }

    fs.stat(localPath(blog.id, path), function(err, stat) {
      if (err && err.code === "ENOENT") {
        drop(blog.id, path, options, done);
      } else if (stat && stat.isDirectory()) {
        mkdir(blog.id, path, options, done);
      } else if (stat && stat.isFile()) {
        set(blog, path, options, done);
      } else {
        done(
          new Error(
            [
              "Not sure what to do with" + path,
              "Stat: " + stat,
              "Error: " + err
            ].join("\n")
          )
        );
      }
    });
  };
};
