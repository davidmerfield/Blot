var colors = require("colors/safe");
var get = require("../../get/blog");

var entryGhosts = require("./entry-ghosts");
var listGhosts = require("./list-ghosts");
var menuGhosts = require("./menu-ghosts");

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
  if (!blog) return callback(new Error("No blog"));

  entryGhosts(blog, function(err) {
    if (err) return callback(err);

    listGhosts(blog, function(err) {
      if (err) return callback(err);
      menuGhosts(blog, function(err) {
        if (err) return callback(err);

        callback(null);
      });
    });
  });
}
