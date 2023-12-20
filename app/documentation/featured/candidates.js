// Should only run in production, will pull in suggestions
// for new sites to feature on the homepage and list the email
// to contact for the site.

var Blog = require("models/blog");
var moment = require("moment");
var Entries = require("models/entries");
var User = require("models/user");
var colors = require("colors/safe");
var async = require("async");
var filter = require("./filter");

if (require.main === module) {
  main(function (err, sites) {
    if (err) throw err;

    console.log("Found " + sites.length + " sites to consider:\n");

    sites.forEach(function (site) {
      console.log();
      console.log(
        "https://" + site.host,
        colors.dim("last published", moment(site.lastPublishedPost).fromNow())
      );
      console.log(
        colors.dim(
          `mailto:${
            site.email
          }?subject=Link%20to%20you%20on%20Blot's%20homepage%3F&body=${encodeURIComponent(`Hello, I'm updating Blot's homepage and I'm going to add some new featured sites hosted on Blot. Would you mind if I added a link to yours? I completely understand if you'd rather not, so no pressure.

          Sincerely, David`)}`
        )
      );
    });

    process.exit();
  });
}

// We want to be able to check if a candidate is already
// featured, so transform the existing list into an array
var featured = require("./featured").map(function (site) {
  return site.host;
});

function main (callback) {
  Blog.getAllIDs(function (err, ids) {
    async.map(
      ids,
      function (id, next) {
        Blog.get({ id: id }, function (err, blog) {
          if (err || !blog || blog.isDisabled || !blog.domain) return next();

          User.getById(blog.owner, function (err, user) {
            if (err || !user || user.isDisabled) return next();

            Entries.getPage(blog.id, 1, 1, function (entries) {
              if (!entries.length) return next();

              next(null, {
                host: blog.domain,
                email: user.email,
                lastPublishedPost: entries[0].dateStamp
              });
            });
          });
        });
      },
      function (err, sites) {
        if (err) return callback(err);

        sites = sites.filter(function (site) {
          return site && site.host && featured.indexOf(site.host) === -1;
        });

        console.log(sites.length, "candidates");

        filter(sites, function (err, sites) {
          if (err) return callback(err);

          console.log(sites.length, "candidates remain post-filter");

          sites.sort(function (a, b) {
            if (a.lastPublishedPost > b.lastPublishedPost) return 1;
            if (b.lastPublishedPost > a.lastPublishedPost) return -1;
            if (a.lastPublishedPost === b.lastPublishedPost) return 0;
          });

          callback(null, sites);
        });
      }
    );
  });
}
