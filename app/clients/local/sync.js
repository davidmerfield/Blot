var fs = require("fs-extra");
var Sync = require("sync");
var localPath = require("helper").localPath;
var model = require("./model");
var async = require("async");

// Start listening for all blogs with this client
model.list(function(err, blogIDs) {
  if (err) throw err;
  blogIDs.forEach(function(blogID) {
    model.get(blogID, function(err, folder) {
      if (err) throw err;
      init(blogID, folder, function(err) {
        if (err) throw err;
      });
    });
  });
});

function init(blogID, folder, callback) {
  fs.watch(folder, { recursive: true }, function(event, path) {
    if (!path) return;

    // Blot likes leading slashes
    path = "/" + path;

    var syncOptions = { retryCount: -1, retryDelay: 10, retryJitter: 10 };
    var stat;
    var affectedPaths = [];
    var pathInUserFolder = folder + path;
    var pathOnBlot = localPath(blogID, path);

    Sync(blogID, syncOptions, function(err, folder, done) {
      if (err) return console.log(err);

      try {
        stat = fs.statSync(pathInUserFolder);
      } catch (e) {
        if (e.code === "ENOENT") {
          try {
            affectedPaths = walk(pathOnBlot).map(function(path) {
              return path.slice(pathOnBlot.length);
            });
          } catch (e) {}

          fs.removeSync(pathOnBlot);
        }
      }

      if (stat && stat.isDirectory()) {
        fs.ensureDirSync(pathOnBlot);
      }

      if (stat && stat.isFile()) {
        fs.copySync(pathInUserFolder, pathOnBlot);
      }

      affectedPaths.push(path);

      async.each(
        affectedPaths,
        function(path, next) {
          folder.update(path, next);
        },
        function() {
          done(null, function(err) {
            if (err) console.log(err);
          });
        }
      );
    });
  });

  callback(null);
}

function walk(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
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

module.exports = init;
