/*

I want to be able to generate a wall of featured sites (~100) of users who have consented to appear on the homepage which are guaranteed to be still hosted by Blot. 

Return the following data:
    - first name + last name, e.g. 'John Smith'
    - a short one-sentence bio, e.g. 'is an antiquarian from London'
    - url to site, e.g. 'https://www.johnsmith.com'
    - pretty hostname, e.g. 'johnsmith.com'
    - template used on the site, e.g. 'Feed template'
    - favicon or avatar 16 x 16

Generate an email I can send to customers asking for permission to link to their site.

Sort the sites by the latest published post?

Want to be able to run the script once per day so the sites are always fresh even if the server doesn't go down...

Want to be able to paste in an avatar....

This shouldn't be in source code. I don't want to be distributing this, perhaps a data directory...

*/

var eachBlog = require("../../each/blog");
var Entries = require("../../../app/models/entries");
var request = require("request");
var colors = require("colors/safe");
var featured = [];

var Path = require("path");
var outputPath = Path.resolve(
  __dirname + "/../../../data/brochure/featured-sites/sites.json"
);
var fs = require("fs-extra");

fs.ensureDirSync(Path.dirname(outputPath));

console.log("Checking blogs...", outputPath);

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
