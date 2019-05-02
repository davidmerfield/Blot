var colors = require("colors/safe");
var get = require("../../get/blog");
var sync = require("../../../app/sync");
var walk = require("./walk");
var async = require("async");

if (require.main === module) {
  get(process.argv[2], function(err, user, blog) {
    if (err) throw err;

    main(blog, function(err) {
      if (err) {
        console.error(colors.red("Error:", err.message));
        return process.exit(1);
      }

      console.log('To rebuild all cached images: node scripts/blog/rebuild/cached-images ' + blog.handle);
      console.log('To regenerate all thumbnails: node scripts/blog/rebuild/thumbnails ' + blog.handle);
      process.exit();
    });
  });
}

function main(blog, callback) {
  console.log("Starting sync for", blog.handle);
  sync(blog.id, function(err, folder, done) {
    if (err) return done(err);

    walk(folder.path, function(err, paths) {
      if (err) return done(err);

      async.eachSeries(
        paths,
        function(path, next) {
          // turn absolute path returned by walk into relative path
          // used by Blot inside the user's blog folder...
          path = path.slice(folder.path.length);
          folder.update(path, next);
        },
        function(err) {
          done(err, function(err) {

            console.log("Rebuilt:", process.argv[2]);
            callback(err);
          });
        }
      );
    });
  });
}

module.exports = main;