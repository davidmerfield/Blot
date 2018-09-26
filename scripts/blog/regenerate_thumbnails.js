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
  var store = new Transformer(blog.id, "thumbnails");

  var thumbnailDirectory =
    config.blog_static_files_dir + "/" + blog.id + "/_thumbnails";

  console.log('Blog ' + blog.id + ':', 'Retrieving existing thumbnail files...');

  fs.readdir(thumbnailDirectory, function(err, contents) {
  
    console.log('Blog ' + blog.id + ':', 'Flushing thumbnail data store');
    store.flush(function(err) {
      if (err) throw err;

      rebuildAllEntries(blog, function(err) {
        if (err) throw err;

        console.log('Blog ' + blog.id + ':', 'Removing old thumbnail files...');

        async.each(
          contents,
          function(name, next) {
            var path = thumbnailDirectory + "/" + name;
            console.log("-", path);
            fs.remove(path, next);
          },
          function(err) {
            if (err) return callback(err);

            console.log('Blog ' + blog.id + ':', 'Rebuilt all thumbnails and flushed old ones from disk!');
            callback();
          }
        );
      });
    });
  });
}

module.exports = main;
