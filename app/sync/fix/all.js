const Blog = require("models/blog");
const Sync = require("sync");
const Fix = require("sync/fix");
const async = require("async");

function main (callback) {
  // const finalReport = [];
  Blog.getAllIDs(function (err, blogIDs) {
    async.eachSeries(
      blogIDs,
      function (blogID, next) {
        Blog.get({ id: blogID }, function (err, blog) {
          if (err || !blog) {
            console.error(err || new Error("No blog"));
            return next();
          }
          console.log("Syncing", blog.id, blog.handle);
          Sync(blogID, function (err, folder, done) {
            if (err) {
              console.error(err);
              return next();
            }
            Fix(blog, function (err, report) {
              // if (report && Object.keys(report).length) {
              //   report.blog = { id: blog.id, handle: blog.handle };
              //   // finalReport.push(report);
              // }
              done(null, next);
            });
          });
        });
      },
      function (err) {
        callback(err, finalReport);
      }
    );
  });
}

if (require.main === module) {
  main(function (err, report) {
    if (err) throw err;
    console.log(report);
    console.log("Done!");
    process.exit();
  });
}

module.exports = main;
