var stat = require("./stat");
var fs = require("fs-extra");
var join = require("path").join;
var async = require("async");
var blog_folder_dir = require("config").blog_folder_dir;
var stat = require("./stat");
var alphanum = require("./alphanum");

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
      dir = dir.toLowerCase();
      localPath = join(blog_folder_dir, req.blog.id, dir);
      return fs.readdir(localPath, render);
    }

    if (err && err.code === "ENOENT") {
      return fs.readdir(join(blog_folder_dir, req.blog.id), render);
    }

    if (err) {
      return next(err);
    }

    contents = contents.filter(function(name) {
      // hide dotfiles
      return (
        name[0] !== "." &&
        // hide preview files
        name.slice(-".preview.html".length) !== ".preview.html"
      );
    });

    contents = contents.map(function(name) {
      return join(dir, name);
    });

    if (contents.length) contents[contents.length - 1].last = true;

    async.eachLimit(contents, 10, load, function() {
      folders = alphanum(folders, { property: "name" });
      files = alphanum(files, { property: "name" });

      res.locals.folder.contents = folders.concat(files);
      res.locals.folder.directory = true;
      next();
    });
  });
};
