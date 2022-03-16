var sync = require("sync/index");
var async = require("async");
var fs = require("fs");
var path = require("path");

function walk(dir, done) {
  var results = [];
  fs.readdir(dir, function (err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function (file) {
      file = path.resolve(dir, file);
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function (err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

module.exports = function main(blog, callback) {
  console.log("Starting sync for", blog.handle);
  sync(blog.id, function (err, folder, done) {
    if (err) return done(err);

    walk(folder.path, function (err, paths) {
      if (err) return done(err);

      async.eachSeries(
        paths,
        function (path, next) {
          // turn absolute path returned by walk into relative path
          // used by Blot inside the user's blog folder...
          path = path.slice(folder.path.length);
          folder.update(path, next);
        },
        function (err) {
          done(err, function (err) {
            console.log("Rebuilt:", process.argv[2]);
            callback(err);
          });
        }
      );
    });
  });
};
