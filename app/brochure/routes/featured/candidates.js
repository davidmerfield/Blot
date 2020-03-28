// Should only run in production, will pull in suggestions
// for new sites to feature on the homepage and list the email
// to contact for the site.

var Blog = require("blog");
var moment = require("moment");
var Entries = require("entries");
var User = require("user");
var colors = require("colors/safe");
var async = require("async");
var filter = require("./filter");

if (require.main === module) {
  main(function(err, sites) {
    if (err) throw err;

    console.log("Found " + sites.length + " sites to consider:\n");

    sites.forEach(function(site) {
      console.log(
        "https://" + site.host,
        colors.dim("last published", moment(site.lastPublishedPost).fromNow()),
        site.email
      );
    });

    process.exit();
  });
}

// We want to be able to check if a candidate is already
// featured, so transform the existing list into an array
var featured = require("./featured").map(function(site) {
  return site.host;
});

function main(callback) {
  Blog.getAllIDs(function(err, ids) {
    async.map(
      ids,
      function(id, next) {
        Blog.get({ id: id }, function(err, blog) {
          if (err || !blog || blog.isDisabled || !blog.domain) return next();

          User.getById(blog.owner, function(err, user) {
            if (err || !user || user.isDisabled) return next();

            Entries.getPage(blog.id, 1, 1, function(entries) {
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
      function(err, sites) {
        if (err) return callback(err);

        sites = sites.filter(function(site) {
          return site && site.host && featured.indexOf(site.host) === -1;
        });

        console.log(sites.length, "candidates");

        filter(sites, function(err, sites) {
          if (err) return callback(err);

          console.log(sites.length, "candidates remain post-filter");

          sites.sort(function(a, b) {
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
