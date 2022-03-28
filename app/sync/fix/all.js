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
          Sync(blogID, function (err, folder, done) {
            if (err) return next(err);
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
