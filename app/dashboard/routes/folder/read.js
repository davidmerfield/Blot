var stat = require("./stat");
var fs = require("fs-extra");
var join = require("path").join;
var helper = require("helper");
var forEach = helper.forEach;
var blog_folder_dir = require("config").blog_folder_dir;
var stat = require("./stat");

function dir(blog, dir, callback) {
  var blogID = blog.id;
  var files = [];
  var folders = [];

  function load(path, callback) {
    stat(blog, path, function(err, stat) {
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

  fs.readdir(join(blog_folder_dir, blogID, dir), function(err, contents) {
    if (err) return callback(err);

    contents = contents.map(function(name) {
      return join(dir, name);
    });

    forEach(contents, load, function() {
      callback(null, folders.concat(files), dir);
    });
  });
}

module.exports = dir;
