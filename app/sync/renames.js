var Entries = require("entries");
var async = require("async");
var Entry = require("entry");

module.exports = function(blogID, update, callback) {
  var RENAME_PERIOD = 1000 * 60; // 1 minute
  var after = Date.now() - RENAME_PERIOD;

  var renames = {};

  Entries.getCreated(blogID, after, function(err, createdEntries) {
    if (err) return callback(err);

    Entries.getDeleted(blogID, after, function(err, deletedEntries) {
      if (err) return callback(err);

      createdEntries.forEach(function(createdEntry) {
        var deletedEntriesOfSameSize;
        var deletedEntriesOfSameTitle;
        var deletedEntry;

        deletedEntriesOfSameSize = deletedEntries.filter(function(
          deletedEntry
        ) {
          return deletedEntry.size === createdEntry.size;
        });

        deletedEntriesOfSameTitle = deletedEntries.filter(function(
          deletedEntry
        ) {
          return deletedEntry.title === createdEntry.title;
        });

        if (deletedEntriesOfSameSize.length === 1) {
          deletedEntry = deletedEntriesOfSameSize.pop();
        } else if (deletedEntriesOfSameTitle.length === 1) {
          deletedEntry = deletedEntriesOfSameTitle.pop();
        } else {
          return;
        }

        deletedEntries = deletedEntries.filter(function(entry) {
          return deletedEntry.path !== entry.path;
        });

        renames[createdEntry.path] = {
          createdEntry: createdEntry,
          deletedEntry: deletedEntry
        };
      });

      async.eachOfSeries(
        renames,
        function(rename, deletedPath, next) {
          var createdEntry = rename.createdEntry;
          var deletedEntry = rename.deletedEntry;
          var updates = {
            url: deletedEntry.url,
            created: deletedEntry.created,
            guid: deletedEntry.guid
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

          console.log(
            "Blog:",
            blogID,
            "Entry rename detected:",
            "\n (deleted)",
            deletedEntry.path,
            "\n (created)",
            createdEntry.path
          );

          Entry.set(blogID, createdEntry.path, updates, next);
        },
        callback
      );
    });
  });
};
