var Lease = require('../lease');
var async = require('async');

// Look up users who were syncing when this
// process was last shutdown
console.log('Checking for syncing users during last shutdown...');
Lease.active(function(err, blogIDs){

  if (err) throw err;

  blogIDs = blogIDs || [];

  async.eachSeries(blogIDs, function(blogID, nextBlog){

    console.log('Need to resync the folder of', blogID,'...');

    // We probably need to release the least of this user
    // since it
    Lease.release(blogID, function(err){

      if (err) throw err;

      nextBlog();
    });
  }, function(){
    console.log("All blogs checked...");
  });
});


// // sync
// var VerifyFolder = ''; // require('../dropbox/verify');
// var VerifyBlog = ''; // require('../../verify');
// var Sync = require('../start');
// Sync(blogID, function(err){

//   if (err) {
//     console.log(err);
//     if (err.stack) console.log(err.stack);
//     if (err.trace) console.log(err.trace);
//     return nextBlog();
//   }

//   // ensure folder is in sync...
//   VerifyFolder(blogID, function(err){

//     if (err) {
//       console.log(err);
//       if (err.stack) console.log(err.stack);
//       if (err.trace) console.log(err.trace);
//       return nextBlog();
//     }

//     console.log('Verifying blog data of ', blogID ,'...');

//     VerifyBlog(blogID, function(err){

//       if (err) {
//         console.log(err);
//         if (err.stack) console.log(err.stack);
//         if (err.trace) console.log(err.trace);
//       }

//       nextBlog();
//     });
//   });
// });