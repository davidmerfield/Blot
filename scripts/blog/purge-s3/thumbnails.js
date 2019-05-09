var Entry = require("entry");
var Entries = require("entries");
var async = require("async");
var download = require("./util/download");
var dirname = require("path").dirname;
var basename = require("path").basename;
var yesno = require("yesno");
var config = require("config");

var CDN = "blotcdn.com";

function main(blog, next) {
  console.log("Blog:", blog.id, "Checking thumbnails...");
  Entries.each(
    blog.id,
    function(entry, next) {
      downloadThumbnails(blog.id, entry, next);
    },
    next
  );
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

if (require.main === module) require("./util/cli")(main);

module.exports = main;
