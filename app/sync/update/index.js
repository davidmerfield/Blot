var fs = require("fs-extra");
var localPath = require("helper/localPath");
var clfdate = require("helper/clfdate");
var hashFile = require("helper/hashFile");
var drop = require("./drop");
var set = require("./set");
var mkdir = require("./mkdir");
var flushCache = require("models/blog/flushCache");
var caseSensitivePath = require("helper/caseSensitivePath");

module.exports = function (blog, log, status) {
  return function update(path, options, callback) {
    if (callback === undefined && typeof options === "function") {
      callback = options;
      options = {};
    }

    status("Syncing " + path);

    caseSensitivePath(localPath(blog.id, "/"), path, function (
      err,
      caseResolvedPath
    ) {
      if (caseResolvedPath) {
        path = caseResolvedPath.slice(localPath(blog.id, "/").length);
      }

      console.log("hashing file", path);

      // Blot likes leading slashes, the git client
      // for instance does not have them but we
      // are not so strict above these things...
      if (path[0] !== "/") path = "/" + path;

      status("New path is: " + path);

      hashFile(localPath(blog.id, path), function (err, hashBefore) {
        function done(err) {
          // we never let this error escape out
          if (err) {
            console.error(clfdate(), blog.id, path, err);
          }
          hashFile(localPath(blog.id, path), function (err, hashAfter) {
            if (hashBefore !== hashAfter) update(path, options, callback);

            // the cache is flushed at the end of a sync too
            // but if we don't do it after updating each files
            // long syncs can produce weird cache behaviour
            flushCache(blog.id, function () {
              callback(null, { error: err || null });
            });
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
    });
  };
};
