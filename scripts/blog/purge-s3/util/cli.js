var Blog = require("blog");
var async = require("async");
var yesno = require("yesno");
var async = require("async");
var get = require("../../../get/blog");
var config = require("config");
var colors = require("colors/safe");

function startMessage(blog) {
  return (
    colors.dim("\nBlog: " + blog.id) +
    colors.yellow(" https://" + blog.handle + "." + config.host) +
    " Processing..."
  );}

function endMessage(blog) {
  return (
    colors.dim("Blog: " + blog.id) +
    colors.yellow(" https://" + blog.handle + "." + config.host) +
    " Complete!"
  );
}

module.exports = function(main, options) {
  function cb(err) {
    if (err) throw err;
    console.log("Finished!");
    process.exit();
  }

  if (process.argv[2]) {
    get(process.argv[2], function(err, user, blog) {
      console.log(startMessage(blog));
      main(blog, function(err) {
        if (err) return cb(err);

        console.log(endMessage(blog));
        cb();
      });
    });
  } else {
    Blog.getAllIDs(function(err, blogIDs) {
      async.eachSeries(
        blogIDs,
        function(blogID, next) {
          Blog.get({ id: blogID }, function(err, blog) {
            console.log(startMessage(blog));
            main(blog, function(err) {
              if (err) return next(err);

              if (options && options.skipAsk) {
                console.log(endMessage(blog));
                return next();
              }

              yesno.ask(endMessage(blog) + " Continue?", true, function(ok) {
                if (ok) next();
              });
            });
          });
        },
        cb
      );
    });
  }
};
