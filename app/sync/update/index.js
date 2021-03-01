var fs = require("fs-extra");
var helper = require("helper");
var localPath = helper.localPath;
var clfdate = helper.clfdate;
var hashFile = helper.hashFile;
var drop = require("./drop");
var set = require("./set");
var mkdir = require("./mkdir");
var client = require("client");

module.exports = function (blog) {
  return function update(path, options, callback) {
    if (callback === undefined && typeof options === "function") {
      callback = options;
      options = {};
    }

    client.publish("sync:status:" + blog.id, "Syncing " + path);

    // Blot likes leading slashes, the git client
    // for instance does not have them but we
    // are not so strict above these things...
    if (path[0] !== "/") path = "/" + path;

    hashFile(path, function (err, hashBefore) {
      function done(err) {
        // we never let this error escape out
        if (err) {
          console.error(clfdate(), blog.id, path, err);
        }

        hashFile(path, function (err, hashAfter) {
          if (hashBefore === hashAfter) callback(null, { error: err || null });
          else update(path, options, callback);
        });
      }

      fs.stat(localPath(blog.id, path), function (err, stat) {
        if (err && err.code === "ENOENT") {
          drop(blog.id, path, options, done);
        } else if (stat && stat.isDirectory()) {
          mkdir(blog.id, path, options, done);
        } else {
          set(blog, path, options, done);
        }
      });
    });
  };
};
