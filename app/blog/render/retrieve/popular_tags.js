var Tags = require("models/tags");
var Entry = require("models/entry");
var async = require("async");

module.exports = function (req, callback) {
  Tags.list(req.blog.id, function (err, tags) {
    // In future, we might want to expose
    // other options for this sorting...
    tags = tags.sort(function (a, b) {
      if (a.entries.length > b.entries.length) return -1;

      if (a.entries.length < b.entries.length) return 1;

      return 0;
    });

    async.each(
      tags,
      function (tag, next) {
        // so we can do {{tag}} since I like it.
        tag.tag = tag.name;
        tag.total = tag.entries.length;

        Entry.get(req.blog.id, tag.entries, function (entries) {
          tag.entries = entries;
          next();
        });
      },
      function () {
        callback(null, tags);
      }
    );
  });
};
