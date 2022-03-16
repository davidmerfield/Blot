var Tags = require("models/tags");
var Entry = require("models/entry");
var async = require("async");
var client = require("client");

module.exports = function main(blog, callback) {
  const report = [];
  Tags.list(blog.id, function (err, tags) {
    async.eachSeries(
      tags,
      function (tag, next) {
        Tags.get(blog.id, tag.slug, function (err, entryIDs) {
          async.each(
            entryIDs,
            function (entryID, next) {
              Entry.get(blog.id, entryID, function (entry) {
                if (entry.id === entryID) return next();
                report.push(["MISMATCH", entryID, entry.id]);
                var multi = client.multi();
                var entryKeyForIncorrectID = Tags.key.entry(blog.id, entryID);
                var entryKeyForCorrectID = Tags.key.entry(blog.id, entry.id);
                var tagKey = Tags.key.tag(blog.id, tag.slug);

                multi.rename(entryKeyForIncorrectID, entryKeyForCorrectID);
                multi.srem(tagKey, entryID);
                multi.sadd(tagKey, entry.id);
                multi.exec(function (err) {
                  if (err) return next(err);
                  Entry.set(blog.id, entry.id, entry, next);
                });
              });
            },
            next
          );
        });
      },
      function (err) {
        if (err) return callback(err);
        callback(null, report);
      }
    );
  });
};
