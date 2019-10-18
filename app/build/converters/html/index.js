var fs = require("fs");
var helper = require("helper");
var ensure = helper.ensure;
var LocalPath = helper.localPath;
var extname = require("path").extname;

function is(path) {
  return [".html", ".htm"].indexOf(extname(path).toLowerCase()) > -1;
}

function read(blog, path, options, callback) {
  ensure(blog, "object")
    .and(path, "string")
    .and(options, "object")
    .and(callback, "function");

  var localPath = LocalPath(blog.id, path);

  fs.stat(localPath, function(err, stat) {
    if (err) return callback(err);

    fs.readFile(localPath, "utf-8", function(err, contents) {
      if (err) return callback(err);

      return callback(null, contents, stat);
    });
  });
}

module.exports = { read: read, is: is };
