var Blog = require("blog");
var async = require("async");
var yesno = require("yesno");
var async = require("async");
var get = require("../../../get/blog");

module.exports = function(main, options) {
  function cb(err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  }

  if (process.argv[2]) {
    get(process.argv[2], function(err, user, blog) {
      main(blog, cb);
    });
  } else {
    Blog.getAllIDs(function(err, blogIDs) {
      async.eachSeries(
        blogIDs,
        function(blogID, next) {
          Blog.get({ id: blogID }, function(err, blog) {
            console.log("Blog:", blogID, "Processing...");
            main(blog, function(err) {
              if (err) return next(err);

              if (options && options.skipAsk) return next();

              yesno.ask(
                "Blog: " + blogID + " Complete! Continue?",
                true,
                function(ok) {
                  if (ok) next();
                }
              );
            });
          });
        },
        cb
      );
    });
  }
};
