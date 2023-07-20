var fs = require("fs");
var ensure = require("helper/ensure");
var LocalPath = require("helper/localPath");
var extname = require("path").extname;
var cheerio = require("cheerio");

function is(path) {
  return [".gdoc"].indexOf(extname(path).toLowerCase()) > -1;
}

function read(blog, path, options, callback) {
  ensure(blog, "object")
    .and(path, "string")
    .and(options, "object")
    .and(callback, "function");

  var localPath = LocalPath(blog.id, path);

  fs.stat(localPath, function (err, stat) {
    if (err) return callback(err);
    // Don't try and turn HTML files larger than 5mb into posts
    if (stat && stat.size > 5 * 1000 * 1000)
      return callback(new Error("HTML File too big"));

    fs.readFile(localPath, "utf-8", function (err, contents) {
      if (err) return callback(err);
      const $ = cheerio.load(contents, { decodeEntities: false });

      // replaces google docs 'titles' with true h1 tags
      $("p.title").each(function (i, elem) {
        $(this).replaceWith("<h1>" + $(this).html() + "</h1>");
      });

      // remove all inline style attributes
      $("*").removeAttr("style");

      const html = $("body").html();

      return callback(null, html, stat);
    });
  });
}

module.exports = { read: read, is: is };
