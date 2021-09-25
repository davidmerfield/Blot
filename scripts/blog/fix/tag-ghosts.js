var Tags = require("models/tags");
var Entry = require("models/entry");
var async = require("async");
var get = require("../../get/blog");
var client = require("client");

if (require.main === module) {
  get(process.argv[2], function (err, user, blog) {
    if (err) throw err;
    main(blog, function (err) {
      if (err) throw err;
      process.exit();
    });
  });
}

function main(blog, callback) {
  console.log("Blog", blog.id, "Fixing tags");
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
                console.log("MISMATCH", entryID, entry.id);
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
      callback
    );
  });
}
module.exports = main;
