var sync = require("clients/dropbox/sync");
var get = require("../get/blog");
var each = require("../each/blog");
var async = require("async");
console.warn("Warning: this uses an internal method of the Dropbox client.");
console.log('Consider debugging with "export DEBUG=clients:dropbox*"');

if (process.argv[2]) {
  get(process.argv[2], function (err, user, blog) {
    if (err) throw err;
    sync(blog, function (err) {
      if (err) throw err;
      process.exit();
    });
  });
} else {
  var blogs = [];

  each(
    function (user, blog, next) {
      if (blog.client === "dropbox") blogs.push(blog);
      next();
    },
    function () {
      // Sort blogs to sync least recently synced first
      blogs.sort(function (a, b) {
        return a.cacheID > b.cacheID ? 1 : -1;
      });

      async.eachSeries(
        blogs,
        function (blog, next) {
          console.log("Syncing", blog.title, blog.id, new Date(blog.cacheID));
          sync(blog, next);
        },
        function (err) {
          if (err) throw err;
          console.log("Done!");
          process.exit();
        }
      );
    }
  );
}
