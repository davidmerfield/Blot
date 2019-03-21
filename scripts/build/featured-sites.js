var eachBlog = require("../each/blog");
var Entries = require("../../app/models/entries");
var request = require("request");
var colors = require("colors/safe");
var featured = [];

console.log("Checking blogs...");

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

  verify(blog.domain, blog.handle, function(err) {
    if (err) return next();

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
  });
}

function verify(domain, handle, callback) {
  var options = {
    // Change this to https is the
    // user requries SSL to visit blog
    uri: "http://" + domain + "/verify/domain-setup",

    timeout: 1000,

    // The request module has a known bug
    // which leaks memory and event emitters
    // during redirects. We cap the maximum
    // redirects to 5 to avoid encountering
    // errors when it creates 10+ emitters
    // for a URL with 10+ redirects...
    maxRedirects: 5
  };

  request(options, function(err, res, body) {
    if (err) return callback(err);

    if (body !== handle) return callback(new Error("Not same handle"));

    callback(null);
  });
}
