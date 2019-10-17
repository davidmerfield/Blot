var fs = require("fs-extra");
var Sync = require("sync");
var Folder = require("../models/folder");
var async = require("async");
var debug = require("debug")("blot:clients:local:watch");
var localPath = require("helper").localPath;
var walk = require("./util/walk");

// This method watches the source folder for subsequent
// changes after the initial synchronization.
module.exports = function watch(blogID, folder) {
  var queue, watcher;
  // We want to queue up and process in order
  // events from the file system.
  queue = async.queue(handler);

  try {
    // To stop this watcher, call watcher.close();
    watcher = fs.watch(folder, { recursive: true }, function(event, path) {
      queue.push({ event: event, path: path });
    });
  } catch (e) {
    return console.error(e);
  }

  function handler(task, callback) {
    debug("Beginning sync...");
    var path = task.path;
    if (!path) {
      debug("Warning no path...");
      return callback();
    }
    // Blot likes leading slashes
    path = "/" + path;
    var syncOptions = { retryCount: -1, retryDelay: 10, retryJitter: 10 };
    var affectedPaths = [path];
    var pathInFolder = folder + path;
    var pathOnBlot = localPath(blogID, path);
    Folder.get(blogID, function(err, folder) {
      // Check the folder is still connected to a client
      if (!folder) return watcher.close();
      Sync(blogID, syncOptions, function(err, folder, done) {
        if (err) return callback(err);
        fs.stat(pathInFolder, function(err, stat) {
          try {
            affectedPaths = affectedPaths.concat(
              walk(pathOnBlot).map(function(path) {
                return path.slice(folder.path.length);
              })
            );
          } catch (e) {}
          try {
            affectedPaths = affectedPaths.concat(
              walk(pathInFolder).map(function(path) {
                return path.slice(folder.length);
              })
            );
          } catch (e) {}
          if (stat) {
            fs.copySync(pathInFolder, pathOnBlot);
          } else {
            fs.removeSync(pathOnBlot);
          }
          async.each(affectedPaths, folder.update, function(err) {
            if (err) console.log(err);
            done(null, function(err) {
              if (err) return callback(err);
              debug("Completed sync");
              callback();
            });
          });
        });
      });
    });
  }
};
