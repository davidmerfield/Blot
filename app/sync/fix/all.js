const Blog = require("models/blog");
const Sync = require("sync");
const Fix = require("sync/fix");

module.exports = function (callback) {
  Blog.getAllIDs(function (err, blogIDs) {
    async.eachSeries(
      blogIDs,
      function (blogID, next) {
        Blog.get({ id: blogID }, function (err, blog) {
          Sync(blogID, function (err, folder, done) {
            Fix(blog, function(err){

            })
          });
        });
      },
      function (err) {
        callback(err);
      }
    );
  });
};
