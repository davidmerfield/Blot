var fs = require("fs");
var ensure = require("helper/ensure");
var LocalPath = require("helper/localPath");
var time = require("helper/time");
var extname = require("path").extname;

var layout = require("./layout");
var katex = require("./katex");
var convert = require("./convert");
var metadata = require("./metadata");
var extractBibAndCSL = require("./extractBibAndCSL");
var linebreaks = require("./linebreaks");

function is (path) {
  return (
    [".txt", ".text", ".md", ".markdown"].indexOf(extname(path).toLowerCase()) >
    -1
  );
}

function read (blog, path, options, callback) {
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

      // Normalize newlines. Windows does \r\n
      // Some strange text editor does \r\r.
      text = text.replace(/\r\r/gm, "\n\n");

      time("metadata");
      text = metadata(text);
      time.end("metadata");

      time("layout");
      text = layout(text);
      time.end("layout");

      if (blog.plugins.linebreaks.enabled) {
        time("linebreaks");
        text = linebreaks(text);
        time.end("linebreaks");
      }

      if (blog.plugins.katex.enabled) {
        time("katex");
        text = katex(text);
        time.end("katex");
      }

      extractBibAndCSL(blog, path, text, function (err, bib, csl) {
        if (err) return callback(err);

        let options = {
          bib: bib,
          csl: csl
        };

        convert(blog, text, options, function (err, html) {
          if (err) return callback(err);

          callback(null, html, stat);
        });
      });
    });
  });
}

module.exports = { read: read, is: is };
