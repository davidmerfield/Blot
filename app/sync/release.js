var async = require("async");
var Lease = require("./lease");

Lease.release.all = function(callback) {
  Lease.active(function(err, blogIDs) {
    if (err) throw err;

    blogIDs = blogIDs || [];

    async.eachSeries(
      blogIDs,
      function(blogID, nextBlog) {
        // We probably need to release the least of this user
        // since it
        Lease.release(blogID, function(err) {
          if (err) throw err;

          nextBlog();
        });
      },
      callback
    );
  });
};

module.exports = Lease.release;