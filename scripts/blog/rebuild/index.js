var colors = require("colors/safe");
var get = require("../../get/blog");
var rebuild = require("sync/rebuild");

if (require.main === module) {
  get(process.argv[2], function (err, user, blog) {
    if (err) throw err;

    const options = {};

    rebuild(blog.id, options, function (err) {
      if (err) {
        console.error(colors.red("Error:", err.message));
        return process.exit(1);
      }

      process.exit();
    });
  });
}
