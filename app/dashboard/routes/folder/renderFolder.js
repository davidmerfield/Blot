var stat = require("./stat");
var fs = require("fs-extra");
var join = require("path").join;
var helper = require("helper");
var forEach = helper.forEach;
var blog_folder_dir = require("config").blog_folder_dir;
var stat = require("./stat");

module.exports = function(req, res, next) {
  var dir = req.dir;
  var localPath = join(blog_folder_dir, req.blog.id, dir);
  var files = [];
  var folders = [];

  function load(path, callback) {
    stat(req.blog, path, function(err, stat) {
      if (err) {
        return callback();
      }

      if (stat.directory) {
        folders.push(stat);
      } else {
        files.push(stat);
      }

      callback();
    });
  }

  fs.readdir(localPath, function render(err, contents) {
    if (err && err.code === "ENOTDIR") {
      return next();
    }

    if (err && err.code === "ENOENT" && dir === "/") {
      return fs.ensureDir(join(blog_folder_dir, req.blog.id), function(err) {
        if (err) return next(err);
        fs.readdir(localPath, render);
      });
    }

    // If the user has the Dropbox client, case-preserved folder
    // is stored lowercase on disk. So we check that too.
    if (err && err.code === "ENOENT" && dir.toLowerCase() !== dir) {
      return fs.readdir(localPath, render);
    }

    if (err && err.code === "ENOENT") {
      return next();
    }

    if (err) {
      return next(err);
    }

    contents = contents.filter(function(name) {
      return name[0] !== ".";
    });

    contents = contents.map(function(name) {
      return join(dir, name);
    });

    forEach(contents, load, function() {
      res.locals.contents = folders.concat(files);
      res.locals.partials.folder = "folder/directory";
      next();
    });
  });
};
