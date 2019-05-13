var Entry = require("entry");
var Entries = require("entries");
var async = require("async");
var dirname = require("path").dirname;
var basename = require("path").basename;
var config = require("config");
var cheerio = require("cheerio");

var download = require("./util/download");
var CDN = "blotcdn.com";

function main(blog, callback) {
  console.log("Blog:", blog.id, "Checking cached images...");

  Entries.each(
    blog.id,
    function(entry, next) {
      var initial = JSON.stringify(entry, null, 2);

      async.eachOfSeries(
        entry,
        function(value, property, next) {
          if (["html", "body", "teaser", "teaserBody", "titleTag"].indexOf(property) === -1)
            return next();

          var urls = [];

          var $ = cheerio.load(value);

          $("[href],[src]").each(function() {
            var url = $(this).attr("href") || $(this).attr("src");
            if (!url) return;
            if (url.indexOf(CDN) > -1) {
              urls.push(url);
            }
          });

          async.eachSeries(
            urls,
            function(url, next) {
              var urlPath =
                "/_image_cache/" +
                dirname(url)
                  .split("/")
                  .pop() +
                "/" +
                basename(url);
              var path = config.blog_static_files_dir + "/" + blog.id + urlPath;

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

          if (latest === initial) return next();

          Entry.set(blog.id, entry.id, entry, next);
        }
      );
    },
    callback
  );
}

if (require.main === module) require("./util/cli")(main);

module.exports = main;
