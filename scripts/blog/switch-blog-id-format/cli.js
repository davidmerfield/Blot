var Blog = require("blog");
var async = require("async");
var yesno = require("yesno");
var async = require("async");
var get = require("../../get/blog");
var colors = require("colors/safe");
var config = require("config");

function startMessage(oldBlogID) {
  return colors.dim("\nBlog: " + oldBlogID) + " Switching blog ID";
}

function endMessage(oldBlogID, blog, access) {
  return (
    colors.dim("Blog: " + oldBlogID) +
    " New ID:    " +
    colors.cyan(blog.id) +
    "\n" +
    colors.dim("Blog: " + oldBlogID) +
    " Live site: " +
    colors.yellow("https://" + blog.handle + "." + config.host + (blog.domain ?  ' - https://' + blog.domain : '')) +
    "\n" +
    colors.dim("Blog: " + oldBlogID) +
    " Dashboard: " +
    colors.green(access)
  );
}

module.exports = function(main, options) {
  function cb(err) {
    if (err) throw err;
    console.log("Finished!");
    process.exit();
  }

  var oldBlogID = process.argv[2];

  if (oldBlogID) {
    console.log(startMessage(oldBlogID));
    main(oldBlogID, function(err, newBlogID) {
      if (err) return cb(err);

      get(newBlogID, function(err, user, blog) {
        console.log(endMessage(oldBlogID, blog));
        cb();
      });
    });
  } else {
    Blog.getAllIDs(function(err, blogIDs) {
      async.eachSeries(
        blogIDs,
        function(blogID, next) {
          if (blogID.indexOf("blog_") === 0) return next();

          console.log(startMessage(blogID));
          main(blogID, function(err, newBlogID) {
            if (err) return next(err);

            get(newBlogID, function(err, user, blog, access) {
              console.log(endMessage(blogID, blog, access));

              if (options && options.skipAsk) {
                return next();
              }

              yesno.ask("\nContinue?", true, function(ok) {
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
