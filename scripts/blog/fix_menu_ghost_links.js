var get = require("./get");
var Entry = require("../../app/models/entry");
var Blog = require("../../app/models/blog");
var async = require("async");
var yesno = require("yesno");

if (require.main === module) {
  get(process.argv[2], function(user, blog) {
    main(blog, function(err) {
      if (err) throw err;
      console.log("Saved menu.");
      process.exit();
    });
  });
}

var existing = {};

function main(blog, callback) {
  console.log("Existing menu:");
  console.log(blog.menu);
  console.log();
  console.log("Checking each link...");

  async.map(
    blog.menu,
    function(item, next) {
      Entry.get(blog.id, item.id, function(entry) {
        if (entry && entry.deleted) {
          console.log("Will delete", item);
          next(null, null);
        } else if (entry && existing[entry.id] === true) {
          console.log("Will delete", item, "which is duplicated on the menu");
          next(null, null);
        } else if (entry) {
          if (item.label !== entry.title) {
            item.label = entry.title;
            console.log(item.id, "setting label to", item.label);
          }

          if (item.metadata !== entry.metadata) {
            item.metadata = entry.metadata;
            console.log(item.id, "setting metadata to", item.metadata);
          }

          if (item.url !== entry.url) {
            item.url = entry.url;
            console.log(item.id, "setting url to", item.url);
          }

          existing[entry.id] = true;
          next(null, item);
        } else {
          if (entry) existing[entry.id] = true;
          next(null, item);
        }
      });
    },
    function(err, results) {
      if (err) return callback(err);

      results = results.filter(function(item) {
        return item !== null;
      });

      console.log();
      console.log("Fixed menu:");
      console.log(results);

      yesno.ask("Save menu? (y/n)", false, function(yes) {
        if (!yes) {
          return callback(new Error("\nDid not apply changes"));
        }
        Blog.set(blog.id, { menu: results }, callback);
      });
    }
  );
}

module.exports = main;
