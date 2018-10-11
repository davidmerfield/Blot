var Entry = require("entry");
var Tags = require("tags");

module.exports = function(req, callback) {
  var blog = req.blog;
  var blogID = blog.id;

  var tagSlug = req.query.name || "";

  Tags.get(blogID, tagSlug, function(err, entryIDs) {
    // {skinny: true},

    Entry.get(blogID, entryIDs, function(entries) {
      entries.sort(function(a, b) {
        return b.dateStamp - a.dateStamp;
      });

      var tagName = tagSlug;

      // We try and work out the pre slug name
      // for the current tag
      if (entries.length)
        for (var i in entries[0].tags)
          if (entries[0].tags[i].slug === tagSlug)
            tagName = entries[0].tags[i].name;

      return callback(null, {
        tag: tagName,
        entries: entries
      });
    });
  });
};
