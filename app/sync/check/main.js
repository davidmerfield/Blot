var VerifyFolder = require('../dropbox/verify');
var VerifyBlog = require('../../verify');
var Lease = require('../lease');
var Sync = require('../start');
var User = require('../../models/user');
var helper = require('../../helper');
var forEach = helper.forEach;

// Look up users who were syncing when this
// process was last shutdown
console.log('Checking for syncing users during last shutdown...');
Lease.active(function(err, uids){

  if (err) throw err;

  uids = uids || [];

  forEach(uids, function(uid, nextUser){

    console.log('Need to resync the folder of', uid,'...');

    // We probably need to release the least of this user
    // since it
    Lease.release(uid, function(err){

      if (err) throw err;

      // sync
      Sync(uid, function(err){

        if (err) {
          console.log(err);
          if (err.stack) console.log(err.stack);
          if (err.trace) console.log(err.trace);
          return nextUser();
        }

        User.getBy({uid:uid}, function(err, user){

          if (err || !user) {
            console.log(err || 'No user');
            return nextUser();
          }

          console.log('Need to verify each blog of ', user.name ,'...');

          forEach(user.blogs, function(blogID, nextBlog){

            console.log('Verifying folder of ', blogID ,'...');

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
          }, nextUser);
        });
      });
    });
  }, function(){

    console.log("All users checked...");
    process.exit();
  });
});