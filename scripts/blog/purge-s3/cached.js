var Blog = require("blog");
var Entry = require("entry");
var Entries = require("entries");
var async = require("async");
var download = require("./download");
var dirname = require("path").dirname;
var basename = require("path").basename;
var yesno = require("yesno");
var config = require("config");
var cheerio = require("cheerio");
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
        console.log("Blog:", blogID, "Checking cached images...");
        Entries.each(
          blogID,
          function(entry, next) {
            downloadCached(blogID, entry, next);
          },
          function() {
            yesno.ask(
              "Blog: " + blogID + " Complete! Continue?",
              true,
              function(ok) {
                if (ok) next();
              }
            );
          }
        );
      },
      callback
    );
  });
}

function downloadCached(blogID, entry, callback) {
  var initial = JSON.stringify(entry, null, 2);

  async.eachOfSeries(
    entry,
    function(value, property, next) {
      if (["html", "body", "teaser", "teaserBody"].indexOf(property) === -1)
        return next();

      var urls = [];

      var $ = cheerio.load(value);

      $("[href],[src]").each(function() {
        var url = $(this).attr("href") || $(this).attr("src");
        if (url.indexOf(CDN) > -1) urls.push(url);
      });

      async.eachSeries(
        urls,
        function(url, next) {
          var urlPath =
            "/_cache/" +
            dirname(url)
              .split("/")
              .pop() +
            "/" +
            basename(url);
          var path = config.blog_static_files_dir + "/" + blogID + urlPath;

          download(url, path, function(err) {
            if (err) return next(err);

            entry[property] = entry[property].split(url).join(urlPath);
            next();
          });
        },
        next
      );
    },
    function() {
      var latest = JSON.stringify(entry, null, 2);

      if (latest === initial) return callback();

      Entry.set(blogID, entry.id, entry, callback);
    }
  );
}

module.exports = main;
