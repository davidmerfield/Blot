var get = require("./get");
var Entry = require("../../app/models/entry");
var Blog = require("../../app/models/blog");
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
          console.log("Need to delete", item.id);
          next(null, false);
        } else {
          next(null, true);
        }
      });
    },
    function(err, results) {
      if (err) return callback(err);

      console.log("Blog " + blog.id + ":", "Checked pages on menu:", results);
      Blog.set(blog.id, { menu: results }, callback);
    }
  );
}

module.exports = main;
