const Blog = require("models/blog");
const Sync = require("sync");
const Fix = require("sync/fix");
const async = require("async");

module.exports = function (callback) {
  const finalReport = [];
  Blog.getAllIDs(function (err, blogIDs) {
    async.eachSeries(
      blogIDs,
      function (blogID, next) {
        Blog.get({ id: blogID }, function (err, blog) {
          if (err || !blog) {
            console.error(err || new Error("No blog"));
            return next();
          }

          Sync(blogID, function (err, folder, done) {
            if (err) {
              console.error(err);
              return next();
            }
            Fix(blog, function (err, report) {
              if (Object.keys(report).length) finalReport.push(report);
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
};
