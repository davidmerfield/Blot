var colors = require("colors/safe");
var Transformer = require("helper").transformer;
var get = require("../../get/blog");
var config = require("config");
var fs = require("fs-extra");
var async = require("async");
var rebuild = require("./index");

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
  var store = new Transformer(blog.id, "thumbnails");

  var thumbnailDirectory =
    config.blog_static_files_dir + "/" + blog.id + "/_thumbnails";

  console.log(
    "Blog " + blog.id + ":",
    "Retrieving existing thumbnail files..."
  );

  fs.readdir(thumbnailDirectory, function(err, contents) {
    console.log("Blog " + blog.id + ":", "Flushing thumbnail data store");
    store.flush(function(err) {
      if (err) return callback(err);

      rebuild(blog, function(err) {
        if (err) return callback(err);

        console.log(
          "Blog " + blog.id + ":",
          "Removing old thumbnail files..."
        );

        async.each(
          contents,
          function(name, next) {
            var path = thumbnailDirectory + "/" + name;
            console.log("-", path);
            fs.remove(path, next);
          },
          function(err) {
            if (err) return callback(err);

            console.log(
              "Blog " + blog.id + ":",
              "Regenerated all thumbnails and flushed old ones from disk!"
            );
            callback();
          }
        );
      });
    });
  });
}

module.exports = main;
