var Sync = require("sync");
var fs = require("fs-extra");
var config = require("config");
var join = require("path").join;

function blog_dir(blog_id) {
  return join(config.blog_folder_dir, blog_id);
}

module.exports = function(blog_id, path) {
  fs.watch(path, { persistent: true, recursive: true }, function(e, filename) {
    filename = "/" + filename;

    Sync(
      blog_id,
      function(change, callback) {
        // On OSX we don't know if the event was a rename, create or delete
        // So we have to check ourselves.
        fs.open(join(blog_dir(blog_id), filename), "r", function(err) {
          if (err && err.code === "ENOENT") {
            return change.drop(filename, callback);
          }

          if (err) {
            throw err;
          }

          change.set(filename, callback);
        });
      },
      function() {
        console.log("Sync complete!");
      }
    );
  });
};
