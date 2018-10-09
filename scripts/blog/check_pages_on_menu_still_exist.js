var get = require("./get");
var Entry = require("../../app/models/entry");
var async = require("async");

if (require.main === module) {
  get(process.argv[2], function(user, blog) {
    main(blog, function(err) {
      if (err) throw err;
      process.exit();
    });
  });
}

function main(blog, callback) {
  console.log(
    "Blog " + blog.id + ":",
    "Checking pages on menu to ensure they still exist...",
    blog.menu
  );
  async.filter(
    blog.menu,
    function(item, next) {
      Entry.get(blog.id, item.id, function(entry) {
        if (entry && entry.deleted) {
          console.log("Need to delete", item);
          next(null, false);
        } else {
          next(null, true);
        }
      });
    },
    function(err, results) {
      console.log(
        "Blog " + blog.id + ":",
        "Checking pages on menu to ensure they still exist..."
      );
      console.log("NEW MENU SHOULD BE:", results);
      callback(err);
    }
  );
}

module.exports = main;
