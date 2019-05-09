var Blog = require("blog");
var Entry = require("entry");
var Entries = require("entries");
var async = require("async");
var download = require("./download");
var dirname = require("path").dirname;
var basename = require("path").basename;
var yesno = require("yesno");
var colors = require("colors/safe");
var fs = require("fs-extra");
var config = require("config");
var humanFileSize = require("./humanFileSize");

var CDN = "blotcdn.com";

if (require.main === module)
  main(function(err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  });

function main(callback) {
  Blog.getAllIDs(function(err, blogIDs) {
    async.eachSeries(
      blogIDs,
      function(blogID, next) {
        console.log('Blog:', blogID, 'Checking thumbnails...');
        Entries.each(
          blogID,
          function(entry, next) {
            downloadThumbnails(blogID, entry, next);
          },
          function() {
            yesno.ask('Blog: ' + blogID + ' Complete! Continue?', true, function(ok) {
              if (ok) next();
            });
          }
        );
      },
      callback
    );
  });
}

function downloadThumbnails(blogID, entry, callback) {
  var initial = JSON.stringify(entry.thumbnail, null, 2);

  async.eachOfSeries(
    entry.thumbnail,
    function(thumbnail, size, next) {
      if (
        (!thumbnail.path || thumbnail.path.indexOf(CDN) === -1) &&
        (!thumbnail.url || thumbnail.url.indexOf(CDN) == -1)
      ) {
        return next();
      }

      var url = thumbnail.url || thumbnail.path;
      var thumbnailPath =
        "/_thumbnails/" +
        dirname(url)
          .split("/")
          .pop() +
        "/" +
        basename(url);
      var path = config.blog_static_files_dir + "/" + blogID + thumbnailPath;

      download(url, path, function(err) {
        if (err) return next(err);

        if (entry.thumbnail[size].path)
          entry.thumbnail[size].path = thumbnailPath;

        if (entry.thumbnail[size].url)
          entry.thumbnail[size].url = thumbnailPath;

        next();
      });
    },
    function() {
      var latest = JSON.stringify(entry.thumbnail, null, 2);

      if (latest === initial) return callback();

      Entry.set(blogID, entry.id, { thumbnail: entry.thumbnail }, callback);
    }
  );
}

module.exports = main;
