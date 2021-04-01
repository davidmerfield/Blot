var fs = require("fs-extra");
var helper = require("helper");
var localPath = require("helper/localPath");
var clfdate = require("helper/clfdate");
var hashFile = require("helper/hashFile");
var drop = require("./drop");
var set = require("./set");
var mkdir = require("./mkdir");
var client = require("client");

module.exports = function (blog, log) {
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
          log(path, "Dropping from database");
          drop(blog.id, path, options, function (err) {
            if (err) {
              log(path, "Error dropping from database", err);
            } else {
              log(path, "Dropping from database succeeded");
            }
            done(err);
          });
        } else if (stat && stat.isDirectory()) {
          log(path, "Adding folder to database");
          mkdir(blog.id, path, options, function (err) {
            if (err) {
              log(path, "Error adding folder", err);
            } else {
              log(path, "Adding folder to database succeeded");
            }
            done(err);
          });
        } else {
          log(path, "Saving file in database");
          set(blog, path, options, function (err) {
            if (err) {
              log(path, "Error saving file in database", err);
            } else {
              log(path, "Saving file in database succeeded");
            }
            done(err);
          });
        }
      });
    });
  };
};
