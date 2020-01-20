var Tags = require("../../../app/models/tags");
var Entry = require("../../../app/models/entry");
var async = require('async');
var get = require("../../get/blog");
if (require.main === module) {
  get(process.argv[2], function(err, user, blog) {
    if (err) throw err;
    main(blog, function(err) {
      if (err) {
        console.error(colors.red("Error:", err.message));
        return process.exit(1);
      }
      process.exit();
    });
  });
}

function main(blog, callback) {
  console.log("Blog", blog.id, "Fixing tags");
  Tags.list(blog.id, function(err, tags) {
    async.eachSeries(tags, function(tag, next) {
      Tags.get(blog.id, tag.slug, function(err, entryIDs) {
        async.each(
          entryIDs,
          function(entryID, next) {
            Entry.get(blog.id, entryID, function(entry) {
              if (entry.id === entryID) return next();
              console.log("MISMATCH", entryID, entry.id);
              Entry.set(blog.id, entry.id, entry, next);
            });
          },
          next
        );
      });
    }, callback)
  });
}
module.exports = main;