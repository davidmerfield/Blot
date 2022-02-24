var fs = require("fs-extra");
var Sync = require("sync");
var Folder = require("clients/local/models/folder");
var async = require("async");
var debug = require("debug")("blot:clients:local:watch");
var localPath = require("helper/localPath");
var walk = require("./util/walk");
var chokidar = require("chokidar");

// This method watches the source folder for subsequent
// changes after the initial synchronization.
module.exports = function watch(blogID, folder) {

  console.log("TEST WATCH", require('path').dirname(folder));
  chokidar.watch(require('path').dirname(folder), { cwd: require('path').dirname(folder) }).on("all", (event, path) => {
    console.log("TEST CHOK:", event, path);
  }).on('error', (err)=>{
    console.log("TEST CHOK err:", err);    
  })

  var queue, watcher;
  // We want to queue up and process in order
  // events from the file system.
  queue = async.queue(handler);

  try {
    // To stop this watcher, call watcher.close();
    console.log("watching", folder);
    watcher = chokidar.watch(folder, { cwd: folder });

    watcher.on("all", (event, path) => {
      console.log("here", event);
      console.log("path", path);
      if (path) queue.push({ event, path });
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
    var affectedPaths = [path];
    var pathInFolder = folder + path;
    var pathOnBlot = localPath(blogID, path);
    Folder.get(blogID, function (err, folder) {
      // Check the folder is still connected to a client
      if (!folder) {
        console.log("here! closing watcher...");
        return watcher.close();
      }
      Sync(blogID, function (err, folder, done) {
        if (err) {
          console.log(
            "Blog",
            blogID,
            "Failed to acquire sync lock on folder. Likely because another child process was working on it..."
          );
          return callback();
        }
        fs.stat(pathInFolder, function (err, stat) {
          try {
            affectedPaths = affectedPaths.concat(
              walk(pathOnBlot).map(function (path) {
                return path.slice(folder.path.length);
              })
            );
          } catch (e) {}
          try {
            affectedPaths = affectedPaths.concat(
              walk(pathInFolder).map(function (path) {
                return path.slice(folder.length);
              })
            );
          } catch (e) {}
          if (stat) {
            fs.copySync(pathInFolder, pathOnBlot);
          } else {
            fs.removeSync(pathOnBlot);
          }
          async.eachSeries(affectedPaths, folder.update, function (err) {
            if (err) console.log(err);
            done(null, function (err) {
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
