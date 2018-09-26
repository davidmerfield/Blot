var Transformer = require("helper").transformer;
var get = require("./get");
var config = require("config");
var fs = require("fs-extra");
var async = require("async");
var rebuildAllEntries = require("./rebuild_all_entries");

if (require.main === module) {
  get(process.argv[2], function(user, blog) {
    main(blog, function(err) {
      if (err) throw err;
      process.exit();
    });
  });
}

function main(blog, callback) {
  var store = new Transformer(blog.id, 'image-cache');

  var thumbnailDirectory =
    config.blog_static_files_dir + "/" + blog.id + "/_image_cache";

  console.log('Blog ' + blog.id + ':', 'Retrieving existing cached images files...');

  fs.readdir(thumbnailDirectory, function(err, contents) {
  
    console.log('Blog ' + blog.id + ':', 'Flushing image cache data store');
    store.flush(function(err) {
      if (err) throw err;

      rebuildAllEntries(blog, function(err) {
        if (err) throw err;

        console.log('Blog ' + blog.id + ':', 'Removing old cached image files...');

        async.each(
          contents,
          function(name, next) {
            var path = thumbnailDirectory + "/" + name;
            console.log("-", path);
            fs.remove(path, next);
          },
          function(err) {
            if (err) return callback(err);

            console.log('Blog ' + blog.id + ':', 'Recached all images and flushed old ones from disk!');
            callback();
          }
        );
      });
    });
  });
}

module.exports = main;
