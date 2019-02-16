var fs = require("fs");
var helper = require("helper");
var ensure = helper.ensure;
var LocalPath = helper.localPath;
var time = helper.time;
var extname = require("path").extname;

var layout = require("./layout");
var katex = require("./katex");
var convert = require("./convert");
var metadata = require("./metadata");

function is(path) {
  return (
    [".txt", ".text", ".md", ".markdown"].indexOf(extname(path).toLowerCase()) >
    -1
  );
}

function read(blog, path, options, callback) {
  ensure(blog, "object")
    .and(path, "string")
    .and(options, "object")
    .and(callback, "function");

  var localPath = LocalPath(blog.id, path);

  time("stat");

  fs.stat(localPath, function(err, stat) {
    time.end("stat");

    if (err) return callback(err);

    time("readFile");

    fs.readFile(localPath, "utf-8", function(err, text) {
      time.end("readFile");

      if (err) return callback(err);

      // Normalize newlines. Windows does \r\n
      // Some strange text editor does \r\r.
      text = text.replace(/\r\r/gm, "\n\n");

      time("metadata");
      text = metadata(text);
      time.end("metadata");

      time("layout");
      text = layout(text);
      time.end("layout");

      if (blog.plugins.katex.enabled) {
        time("katex");
        text = katex(text);
        time.end("katex");
      }

      convert(text, function(err, html) {
        if (err) return callback(err);

        callback(null, html, stat);
      });
    });
  });
}

module.exports = { read: read, is: is };
