var Blog = require("blog");
var Entries = require("entries");
var async = require("async");
var config = require("config");
var prettyNumber = require("helper").prettyNumber;

function main(callback) {
  var new_entries = [];
  var total_entries = 0;
  var now = Date.now();
  var day = 1000 * 60 * 60 * 24;
  var yesterday = now - day;
  Blog.getAllIDs(function(err, blogIDs) {
    async.each(
      blogIDs,
      function(blogID, next) {
        Blog.get({ id: blogID }, function(err, blog) {
          if (err) return next(err);
          Entries.getTotal(blog.id, function(err, total) {
            if (err) return next(err);
            total_entries += total;
            Entries.getRecent(blog.id, function(entries) {
              entries.forEach(function(entry) {
                if (entry.created < yesterday) return;
                if (entry.title)
                  new_entries.push({
                    title: entry.title,
                    link: encodeURI(
                      config.protocol +
                        blog.handle +
                        "." +
                        config.host +
                        entry.url
                    )
                  });
              });
              next();
            });
          });
        });
      },
      function(err) {
        callback(err, {
          new_entries: new_entries,
          total_entries: prettyNumber(total_entries)
        });
      }
    );
  });
}

if (require.main === module) require("./cli")(main);

module.exports = main;
