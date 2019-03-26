// Should only run in production, will pull in suggestions
// for new sites to feature on the homepage and list the email
// to contact for the site.

var eachBlog = require("../../each/blog");
var Entries = require("../../../app/models/entries");
var colors = require("colors/safe");
var featured = [];

eachBlog(checkBlog, function() {
  console.log("Done!");
  process.exit();
});

function checkBlog(user, blog, next) {
  var lastPublishedPost;

  if (user.isDisabled || blog.isDisabled) return next();

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(colors.dim("...", blog.handle));

  if (!blog.domain) return next();

  Entries.getPage(blog.id, 1, 1, function(entries) {
    if (!entries.length) return next();

    lastPublishedPost = entries[0].dateStamp;

    console.log(" >> https://" + blog.domain, "is ok!");

    featured.push({
      domain: blog.domain,
      lastPublishedPost: lastPublishedPost
    });

    next();
  });
}
