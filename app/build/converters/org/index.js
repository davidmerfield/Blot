var fs = require("fs");
var ensure = require("helper/ensure");
var LocalPath = require("helper/localPath");
var time = require("helper/time");
var extname = require("path").extname;

var convert = require("./convert");

function is(path) {
  return [".org"].indexOf(extname(path).toLowerCase()) > -1;
}

function read(blog, path, options, callback) {
  ensure(blog, "object")
    .and(path, "string")
    .and(options, "object")
    .and(callback, "function");

  var localPath = LocalPath(blog.id, path);

  time("stat");

  fs.stat(localPath, function (err, stat) {
    time.end("stat");

    if (err) return callback(err);

    time("readFile");

    fs.readFile(localPath, "utf-8", function (err, text) {
      time.end("readFile");

      if (err) return callback(err);

      convert(blog, text, options, function (err, html) {
        if (err) return callback(err);

        callback(null, html, stat);
      });
    });
  });
}

module.exports = { read: read, is: is };
