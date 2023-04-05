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
          `mailto:${site.email}?subject=Link%20to%20you%20on%20Blot's%20homepage%3F&body=Hello%2C%0A%0AI%20was%20wondering%20if%20I%20could%20add%20a%20link%20to%20your%20site%20to%20Blot's%20homepage%3F%20Absolutely%20no%20pressure%20if%20you'd%20rather%20not%2C%20I%20completely%20understand!%0A%0AEither%20way%2C%20please%20let%20me%20know%20if%20you%20have%20any%20questions%2C%20thoughts%2C%20feedback%20etc.%20Thanks%20for%20giving%20Blot%20a%20go.%0A%0ASincerely%2C%20David`
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

function main(callback) {
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
                lastPublishedPost: entries[0].dateStamp,
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
