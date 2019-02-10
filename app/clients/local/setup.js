var fs = require("fs-extra");
var listen = require("./controllers/sync");
var Sync = require("sync");
var Folder = require("./models/folder");
var async = require("async");

module.exports = function(blogID, folder, callback) {
  console.log('HERE...', blogID, folder, callback);
  fs.ensureDir(folder, function(err) {

    console.log('HERE tooo...');
    if (err) return callback(err);
  console.log('HERE');
    Folder.set(blogID, folder, function(err) {
      if (err) return callback(err);
  console.log('HERE');
      initialSynchronize(blogID, folder, function(err) {
        if (err) return callback(err);
        callback();
        // WATCH for changes...
        listen(blogID, folder, function(err) {
          if (err) return callback(err);
        });
      });
    });
  });
};

function hash(path) {
  return require("crypto")
    .createHash("md5")
    .update(fs.readFileSync(path))
    .digest("hex");
}

function initialSynchronize(blogID, sourceFolder, callback) {
  var sourceFolderMap = {};
  var blotFolderMap = {};
  Sync(blogID, {}, function(err, folder, done) {
    if (err) return callback(err);

    walk(sourceFolder).forEach(function(path) {
      sourceFolderMap[path.slice(sourceFolder.length)] = hash(path);
    });

    walk(folder.path).forEach(function(path) {
      blotFolderMap[path.slice(folder.path.length)] = hash(path);
    });

    async.eachOf(
      blotFolderMap,
      function(hash, path, next) {
        if (sourceFolderMap[path] !== undefined) return next();

        // remove file from blot folder...
        fs.removeSync(folder.path + path);
        folder.update(path, next);
      },
      function(err) {
        if (err) return callback(err);

        async.eachOf(
          sourceFolderMap,
          function(hash, path, next) {
            if (hash === blotFolderMap[path]) return next();

            fs.copySync(sourceFolder + path, folder.path + path);
            folder.update(path, next);
          },
          function(err) {
            if (err) return callback(err);

            done(null, callback);
          }
        );
      }
    );
  });
}

// I know I should use a proper library but this is just
// for illustrative purposes.
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
