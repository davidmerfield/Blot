const set = require("./update/set");
const drop = require("./update/drop");
const Entry = require("models/entry");
const guid = require("helper/guid");
const ensure = require("helper/ensure");

const rename = (blog, log) => (path, oldPath, options, callback) => {
  ensure(blog, "object")
    .and(log, "function")
    .and(path, "string")
    .and(oldPath, "string")
    .and(options, "object")
    .and(callback, "function");

  Entry.get(blog.id, oldPath, function (deletedEntry) {
    drop(blog.id, oldPath, options, function (err) {
      if (err) return callback(err);
      set(blog, path, options, function (err) {
        if (err) return callback(err);
        Entry.get(blog.id, path, function (createdEntry) {
          var updates = {
            url: deletedEntry.url,
            created: deletedEntry.created,
            guid: deletedEntry.guid,
          };

          // If the deleted entry did not have a path specified
          // in its path or its metadata (which we determine by
          // comparing its publish dateStamp with the time it was
          // created on blot) if the new created entry is the same
          // then set the publish dateStamp for the created entry
          // to the publish date of the deleted entry. I amended
          // this logic to fix a bug caused by renaming x.jpg to
          // 2018_10_06.jpg. The newly specified date was clobbered.
          if (
            deletedEntry.dateStamp === deletedEntry.created &&
            createdEntry.dateStamp === createdEntry.created
          ) {
            updates.dateStamp = deletedEntry.dateStamp;
          }

          Entry.set(blog.id, createdEntry.path, updates, function (err) {
            if (err) return callback(err);
            Entry.set(blog.id, oldPath, { guid: "entry_" + guid() }, callback);
          });
        });
      });
    });
  });
};

module.exports = rename;
