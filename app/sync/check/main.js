var VerifyFolder = ''; // require('../dropbox/verify');
var VerifyBlog = ''; // require('../../verify');
var Lease = require('../lease');
var Sync = require('../start');
var helper = require('../../helper');
var forEach = helper.forEach;

// Look up users who were syncing when this
// process was last shutdown
console.log('Checking for syncing users during last shutdown...');
Lease.active(function(err, blogIDs){

  if (err) throw err;

  blogIDs = blogIDs || [];

  forEach(blogIDs, function(blogID, nextBlog){

    console.log('Need to resync the folder of', blogID,'...');

    // We probably need to release the least of this user
    // since it
    Lease.release(blogID, function(err){

      if (err) throw err;

      // sync
      Sync(blogID, function(err){

        if (err) {
          console.log(err);
          if (err.stack) console.log(err.stack);
          if (err.trace) console.log(err.trace);
          return nextBlog();
        }

        // ensure folder is in sync...
        VerifyFolder(blogID, function(err){

          if (err) {
            console.log(err);
            if (err.stack) console.log(err.stack);
            if (err.trace) console.log(err.trace);
            return nextBlog();
          }

          console.log('Verifying blog data of ', blogID ,'...');

          VerifyBlog(blogID, function(err){

            if (err) {
              console.log(err);
              if (err.stack) console.log(err.stack);
              if (err.trace) console.log(err.trace);
            }

            nextBlog();
          });
        });
      });
    });
  }, function(){

    console.log("All blogs checked...");
    process.exit();
  });
});