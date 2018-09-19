var Blog = require("blog");
var Entries = require("entries");
var Entry = require("entry");
var DateStamp = require("../../../../models/entry/build/prepare/dateStamp");

module.exports = function(blogID, callback) {
  Blog.get({ id: blogID }, function(err, blog) {
    Entries.each(
      blogID,
      function(entry, nextEntry) {
        var dateStamp = DateStamp(blog, entry.path, entry.metadata);
        var changes = {};

        // This is fine!
        if (dateStamp !== undefined) changes.dateStamp = dateStamp;

        // We now need to save every entry so that
        // changes to permalink format take effect.
        Entry.set(blog, entry.path, changes, nextEntry);
      },
      callback
    );
  });
};
