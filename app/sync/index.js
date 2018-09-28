var buildFromFolder = require("../modules/template").update;
var async = require("async");
var Blog = require("blog");
var Lease = require("./lease");
var Update = require("./update");

// This function is called when all we know
// is a UID and that we want Blot to sync it.
function sync(blogID, main, callback) {

  Blog.get({ id: blogID }, function(err, blog) {
    
    if (!blog || !blog.id || blog.isDisabled)
      return callback(new Error('Cannot sync blog ' + blogID));

    Lease.request(blogID, function(err) {
      
      if (err) return callback(err);

      main(new Update(blog), function(syncError) {

        Lease.release(blogID, function(err, retry) {
      
          if (err) return callback(err);

          if (retry) return sync(blogID, main, callback);

          buildFromFolder(blogID, function(err){

            if (err) return callback(err);
  
            Blog.flushCache(blogID, function(err) {
              
              if (err) return callback(err);

              callback(syncError);
            });
          });
        });
      });
    });
  });
}

sync.release = Lease.release;

sync.release.all = function(callback) {
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

module.exports = sync;
