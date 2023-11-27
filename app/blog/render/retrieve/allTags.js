var Tags = require("models/tags");
var Entry = require("models/entry");
var async = require("async");

module.exports = function (req, callback) {
  Tags.list(req.blog.id, function (err, tags) {
    // In future, we might want to expose
    // other options for this sorting...
    tags = tags.sort(function (a, b) {
      var nameA = a.name.toLowerCase();
      var nameB = b.name.toLowerCase();

      if (nameA < nameB) return -1;

      if (nameA > nameB) return 1;

      return 0;
    });

    async.eachSeries(
      tags,
      function (tag, next) {
        // so we can do {{tag}} since I like it.
        tag.tag = tag.name;
        tag.total = tag.entries.length;

        Entry.get(req.blog.id, tag.entries, function (entries) {
          tag.entries = entries.sort(function(a, b){
            if (a.dateStamp > b.dateStamp) return -1;
            if (b.dateStamp > a.dateStamp) return 1;
            return 0;
          });

          next();
        });
      },
      function () {
        callback(null, tags);
      }
    );
  });
};
