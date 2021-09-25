const Entry = require("entry");
const Tags = require("tags");
const type = require("helper/type");
const _ = require("lodash");
const async = require("async");

module.exports = function (req, callback) {
  var blog = req.blog;
  var blogID = blog.id;

  var tags = req.query.name || req.query.tag || "";

  if (type(tags, "array")) {
  } else if (type(tags, "string")) {
    tags = [tags];
  } else {
    return callback(new Error("Unexpected type of tag"));
  }

  async.mapSeries(
    tags,
    function (tag, next) {
      Tags.get(blogID, tag, next);
    },
    function (err, allEntryIDs) {
      let entryIDs = _.intersection.apply(null, allEntryIDs);

      Entry.get(blogID, entryIDs, function (entries) {
        entries.sort(function (a, b) {
          return b.dateStamp - a.dateStamp;
        });

        return callback(null, {
          tag: tags.join(" + "),
          entries: entries,
        });
      });
    }
  );
};
