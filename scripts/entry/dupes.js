var redis = require("redis").createClient();
var get = require("../get/entry");
var async = require("async");
var getAllEntries = require("./getAllEntries");
var colors = require("colors/safe");
var moment = require('moment');
var otherEntries, sameTitle;

function print(entries, label) {
  if (!entries.length) return;

  console.log("\n" + label + ":");
  entries.forEach(function(entry, i) {
    console.log(colors.dim('(' + i + ") ") + entry.path, colors.red('deleted:' + entry.deleted), colors.blue(entry.date));
  });
}

get(process.argv[2], function(err, user, blog, entry) {
  if (err) throw err;

  console.log(
    colors.dim("Searching for duplicates of"),
    entry.path,
    colors.dim("(" + process.argv[2] + ")")
  );

  getAllEntries(blog.id, function(err, entries) {
    if (err) throw err;

    entries = entries.map(function(entry){
      entry.date = moment(entry.dateStamp).format(blog.dateFormat);
      return entry
    });

    otherEntries = entries.filter(function(otherEntry) {
      return otherEntry.guid !== entry.guid;
    });

    sameTitle = otherEntries.filter(function(otherEntry) {
      return otherEntry.title === entry.title;
    });

    sameSlug = otherEntries.filter(function(otherEntry) {
      return otherEntry.slug === entry.slug;
    });

    print(sameTitle, colors.dim("Same title '") + entry.title + colors.dim("'"));

    print(sameSlug, colors.dim("Same slug '") + entry.slug + colors.dim("'"));

    console.log("Search complete!");
    process.exit();
  });
});
