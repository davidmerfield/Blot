var get = require("../get/blog");
var async = require("async");
var getAllEntries = require("./getAllEntries");
var colors = require("colors/safe");
var moment = require("moment");
var yesno = require("yesno");
var Entry = require("../../app/models/entry");

var candidates, extantEntries, deletedEntries;

console.log("Finding posts with dates to consider changing...");

get(process.argv[2], function(err, user, blog) {
  if (err) throw err;

  getAllEntries(blog.id, function(err, entries) {
    if (err) throw err;

    // We only care about posts with no date metadata
    // or a date in their path. We know this is true
    // if the file's Ctime is used as the publish date.
    entries = entries.filter(function(entry) {
      return entry.created === entry.dateStamp;
    });

    entries = entries.map(function(entry) {
      entry.date = moment(entry.dateStamp).format(blog.dateFormat);
      return entry;
    });

    extantEntries = entries.filter(function(entry) {
      return entry.deleted === false;
    });

    deletedEntries = entries.filter(function(entry) {
      return entry.deleted === true;
    });

    async.eachSeries(
      extantEntries,
      function(extantEntry, next) {
        candidates = deletedEntries.filter(function(deletedEntry) {
          return (
            extantEntry.dateStamp > deletedEntry.dateStamp &&
            extantEntry.title === deletedEntry.title
          );
        });

        if (!candidates.length) return next();

        var candidate = candidates[0];
        var newDate = candidate.date;
        var newDateStamp = candidate.dateStamp;

        console.log(
          "\n" +
            extantEntry.title +
            "\n" +
            colors.dim(process.argv[2].slice(0, -1) + extantEntry.url)
        );
        console.log(
          colors.dim(
            "Consider the date from the deleted post '" +
              candidate.title +
              "' (" +
              candidate.path +
              ")"
          )
        );
        yesno.ask(
          "> Change date from " +
            colors.red(extantEntry.date) +
            " to " +
            colors.green(newDate) +
            "? (y/n)",
          true,
          function(ok) {
            if (!ok) {
              console.log(colors.dim("Leaving date as is..."));
              return next();
            }

            Entry.set(
              blog.id,
              extantEntry.path,
              { dateStamp: newDateStamp },
              next
            );
          }
        );
      },
      function() {
        console.log();
        console.log("Sorted all entries...");
        process.exit();
      }
    );
  });
});
