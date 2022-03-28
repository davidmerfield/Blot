var colors = require("colors/safe");
var get = require("../../get/blog");
var rebuild = require("sync/reset/rebuild");

if (require.main === module) {
  get(process.argv[2], function (err, user, blog) {
    if (err) throw err;

    rebuild(blog, function (err) {
      if (err) {
        console.error(colors.red("Error:", err.message));
        return process.exit(1);
      }

      console.log(
        "To rebuild all cached images: node scripts/blog/rebuild/cached-images " +
          blog.handle
      );
      console.log(
        "To regenerate all thumbnails: node scripts/blog/rebuild/thumbnails " +
          blog.handle
      );
      process.exit();
    });
  });
}