var stat = require("fs").stat;
var helper = require("helper");
var localPath = helper.localPath;
var basename = require("path").basename;
var dirname = require("path").dirname;
var joinpath = require("path").join;
var moment = require("moment");
require("moment-timezone");

var Entry = require("entry");
var IgnoredFiles = require("../../../models/ignoredFiles");
var extname = require("path").extname;
var Metadata = require("metadata");
var REASONS = {
  PREVIEW: "it is a preview",
  TOO_LARGE: "it is too large",
  PUBLIC_FILE: "it is a public file",
  WRONG_TYPE: "it is not a file Blot can process"
};

var kind = require("./kind");

module.exports = function(blog, path, callback) {
  var blogID = blog.id;
  var local = localPath(blogID, path);

  stat(local, function(err, stat) {
    if (err) return callback(err);

    Metadata.get(blogID, path, function(err, casePresevedName) {
      if (err) return callback(err);

      IgnoredFiles.getStatus(blogID, path, function(err, ignored) {
        if (err) return callback(err);

        Entry.get(blogID, path, function(entry) {
          if (ignored || !entry) {
            if (path.toLowerCase().indexOf("/templates/") === 0) {
              ignored = "it is part of a template";
            } else if (
              path.split("/").filter(function(n) {
                return n[0] === "_";
              }).length
            ) {
              ignored =
                "it is inside a folder whose name begins with an underscore";
            } else if (require("path").basename(path)[0] === "_") {
              ignored = "its name begins with an underscore";
            } else {
              ignored = REASONS[ignored] || "it was ignored";
            }
          }

          stat.kind = kind(path);
          stat.path = path;
          stat.name = casePresevedName || basename(path);
          stat.created = moment
            .utc(stat.ctime)
            .tz(blog.timeZone)
            .calendar(null, {
              sameDay: "[Today], h:mm A",
              lastDay: "[Yesterday], h:mm A",
              lastWeek: "LL, h:mm A",
              sameElse: "LL, h:mm A"
            });
          stat.modified = moment
            .utc(stat.mtime)
            .tz(blog.timeZone)
            .calendar(null, {
              sameDay: "[Today], h:mm A",
              lastDay: "[Yesterday], h:mm A",
              lastWeek: "LL, h:mm A",
              sameElse: "LL, h:mm A"
            });

          stat.updated = moment.utc(stat.mtime).from(moment.utc());
          stat.size = humanFileSize(stat.size);
          stat.directory = stat.isDirectory();
          stat.file = stat.isFile();
          stat.url = joinpath("/~", dirname(path), stat.name);
          stat.entry = entry;
          stat.ignored = ignored;

          if (entry) {
            // Replace with human readable
            entry.updated = stat.updated;
            // Replace with case-preserving
            entry.name = stat.name;

            entry.date = moment
              .utc(entry.dateStamp)
              .tz(blog.timeZone)
              .format("MMMM Do YYYY, h:mma");

            if (
              entry.page &&
              entry.menu === false &&
              [".txt", ".md", ".html"].indexOf(extname(entry.path)) === -1
            ) {
              entry.url = entry.path;
            }

            if (entry.draft) {
              entry.url = "/draft/view" + entry.path;
            }

            if (entry.scheduled) {
              entry.url += "?scheduled=true";
              entry.toNow = moment.utc(entry.dateStamp).fromNow();
            }
          }
          return callback(null, stat);
        });
      });
    });
  });
};

function humanFileSize(size) {
  if (size === 0) return "0 kb";

  var i = Math.floor(Math.log(size) / Math.log(1024));

  return (
    (size / Math.pow(1024, i)).toFixed(2) * 1 +
    " " +
    ["bytes", "kB", "MB", "GB", "TB"][i]
  );
}
