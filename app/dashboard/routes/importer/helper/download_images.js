var cheerio = require("cheerio");
var basename = require("path").basename;
var parse = require("url").parse;
var download = require("download");
var each_el = require("./each_el");
var fs = require("fs-extra");

// Consider using this algorithm to determine best part of alt tag or caption to use
// as the file's name:
// http://www.bearcave.com/misl/misl_tech/wavelets/compression/shannon.html

function download_thumbnail(post, path, callback) {
  if (!post || !post.metadata || !post.metadata.thumbnail) return callback();

  var thumbnail = post.metadata.thumbnail;

  if (!thumbnail) return callback();

  var name = nameFrom(thumbnail);

  download(thumbnail)
    .then(function(data) {
      fs.outputFile(path + "/" + name, data, function(err) {
        callback(err, name);
      });
    })
    .catch(callback);
}

module.exports = function download_images(post, callback) {
  var changes = false;
  var $ = cheerio.load(post.html, { decodeEntities: false });

  download_thumbnail(post, post.path, function(err, thumbnail) {
    if (!err && thumbnail) {
      changes = true;
      post.metadata.thumbnail = thumbnail;
    }

    each_el(
      $,
      "img",
      function(el, next) {
        var src = $(el).attr("src");

        if (!src || src.indexOf("data:") === 0) return next();

        var name = nameFrom(src);
        if (name.charAt(0) !== "_") name = "_" + name;

        if (!require("url").parse(src).hostname) return next();

        download(src)
          .then(function(data) {
            fs.outputFile(post.path + "/" + name, data, function(err) {
              changes = true;

              $(el).attr("src", name);

              if (
                $(el)
                  .parent()
                  .attr("href") === src
              )
                $(el)
                  .parent()
                  .attr("href", name);

              next();
            });
          })
          .catch(function(err) {
            console.log("Image error:", src, err.name, err.statusCode);
            return next();
          });
      },
      function() {
        // Download PDFS or download images might have already moved the output
        // path for this file into its own folder, so check.
        if (changes && post.path.slice(-"/post.txt".length) !== "/post.txt") {
          post.path = post.path + "/post.txt";
        }

        if (!changes && post.path.slice(-".txt".length) !== ".txt") {
          post.path = post.path + ".txt";
        }

        post.html = $.html();

        callback(null, post);
      }
    );
  });
};

function nameFrom(src) {
  return "_" + basename(parse(src).pathname);
}
