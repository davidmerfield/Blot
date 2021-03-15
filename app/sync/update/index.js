const fs = require("fs-extra");
const helper = require("helper");
const localPath = helper.localPath;
const clfdate = helper.clfdate;
const hashFile = helper.hashFile;
const drop = require("./drop");
const set = require("./set");
const mkdir = require("./mkdir");
const client = require("client");

const Queue = helper.queue;
const queue = new Queue("sync");

module.exports = function (blogID, syncID) {
  return function update(path, options, callback) {
    if (callback === undefined && typeof options === "function") {
      callback = options;
      options = {};
    }

    options.syncID = syncID;

    queue.add(blogID, { path, options }, callback);
  };
};

queue.process(function (blogID, { path, options }, callback) {
  client.publish("sync:status:" + blogID, "Syncing " + path);

  // Blot likes leading slashes, the git client
  // for instance does not have them but we
  // are not so strict above these things...
  if (path[0] !== "/") path = "/" + path;

  const log = function () {
    console.log.apply(null, [
      clfdate(),
      blogID.slice(0, 12),
      options.syncID,
      ...arguments,
    ]);
  };

  log(path, "Beginning to update what we know");

  hashFile(path, function (err, hashBefore) {
    function done(err) {
      // we never let this error escape out
      if (err) {
        log(path, "Finished updating with error:", err);
        return callback();
      }

      hashFile(path, function (err, hashAfter) {
        if (hashBefore === hashAfter) {
          log(path, "Finished updating successfully");
          callback();
        } else {
          log(
            path,
            "Finished updating successfully but file has since changed, re-sync it"
          );
          queue.add(blogID, { path, options }, callback);
        }
      });
    }

    fs.stat(localPath(blogID, path), function (err, stat) {
      if (err && err.code === "ENOENT") {
        log(path, "Dropping from database");
        drop(blogID, path, options, function (err) {
          if (err) {
            log(path, "Error dropping from database", err);
          } else {
            log(path, "Dropping from database succeeded");
          }
          done(err);
        });
      } else if (stat && stat.isDirectory()) {
        log(path, "Adding folder to database");
        mkdir(blogID, path, options, function (err) {
          if (err) {
            log(path, "Error adding folder", err);
          } else {
            log(path, "Adding folder to database succeeded");
          }
          done(err);
        });
      } else {
        log(path, "Saving file in database");
        set(blogID, path, options, function (err) {
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
