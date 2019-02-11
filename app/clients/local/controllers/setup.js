var fs = require("fs-extra");
var Sync = require("sync");
var Folder = require("../models/folder");
var async = require("async");
var debug = require("debug")("blot:clients:local");
var localPath = require("helper").localPath;
// Start listening for all blogs with this client
Folder.list(function(err, blogIDs) {
  if (err) throw err;
  blogIDs.forEach(function(blogID) {
    Folder.get(blogID, function(err, folder) {
      if (err) throw err;
      if (!folder) return;
      setup(blogID, folder, function(err) {
        if (err) throw err;
      });
    });
  });
});

function setup(blogID, folder, callback) {
  debug("Setting up local client in", folder);
  fs.ensureDir(folder, function(err) {
    if (err) return callback(err);
    debug("Storing folder for", blogID, "in database");
    Folder.set(blogID, folder, function(err) {
      if (err) return callback(err);
      debug("Synchronizing source folder with Blot");
      synchronize(blogID, folder, function(err) {
        if (err) return callback(err);
        debug("Watching source folder for changes");
        watch(blogID, folder);
        debug("Setup complete");
        callback();
      });
    });
  });
}

// Used to syncrhonize the source folder with Blot
// when the local client is first connected to a blog.
// It walks the source folder and Blot's folder for the
// blog and compares the two, if anything is out of sync
// the changes from the source folder are applied.
function synchronize(blogID, sourceFolder, callback) {
  // We build up two hashes of MD5 digests against
  // paths inside the source folder, e.g. ~/Blog and
  // Blot's folder, e.g. /var/www/blot/blogs/$BLOG_ID
  var sourceFolderTree = {};
  var blotFolderTree = {};
  var updatedPaths = [];

  // We don't want to make any changes to the folder in
  // a way which might conflict with other processes
  // so we acquire a lock on the blog's folder on Blot.
  Sync(blogID, {}, function(err, folder, done) {
    if (err) return callback(err);

    walk(sourceFolder).forEach(function(path) {
      sourceFolderTree[path.slice(sourceFolder.length)] = hash(path);
    });

    walk(folder.path).forEach(function(path) {
      blotFolderTree[path.slice(folder.path.length)] = hash(path);
    });

    // We remove any paths in /blot/blogs/$blog_id which no
    // longer exist in the source folder.
    for (var path in blotFolderTree) {
      if (sourceFolderTree[path] === undefined) {
        fs.removeSync(folder.path + path);
        updatedPaths.push(path);
      }
    }

    // We copy any files from the source folder if the version
    // in /blot/blogs/$blog_id does not match or does not exist.
    for (path in sourceFolderTree) {
      if (sourceFolderTree[path] !== blotFolderTree[path]) {
        fs.copySync(sourceFolder + path, folder.path + path);
        updatedPaths.push(path);
      }
    }

    // We tell Blot to update what it has stored in its database
    // about the files or folders at the paths we modified.
    async.each(updatedPaths, folder.update, function(err) {
      done(err, callback);
    });
  });
}

function hash(path) {
  return require("crypto")
    .createHash("md5")
    .update(fs.readFileSync(path))
    .digest("hex");
}

function walk(dir) {
  var results = [];
  fs.readdirSync(dir).forEach(function(file) {
    file = dir + "/" + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

// This method watches the source folder for subsequent
// changes after the initial synchronization.
function watch(blogID, folder) {
  var queue, watcher;
  // We want to queue up and process in order
  // events from the file system.
  queue = async.queue(handler);
  // To stop this watcher, call watcher.close();
  watcher = fs.watch(folder, { recursive: true }, function(event, path) {
    queue.push({ event: event, path: path });
  });

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
              debug('Completed sync');
              callback();
            });
          });
        });
      });
    });
  }
}
module.exports = setup;
