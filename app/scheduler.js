var Entries = require('./models/entries');
var Entry = require('./models/entry');
var User = require('./models/user');
var email = require('helper').email;
var async = require('async');
var schedule = require('node-schedule').scheduleJob;
var Blog = require('./models/blog');
var backup = require('./backup');
var dailyUpdate = require('../scripts/info/dailyUpdate');
var Sync = require('sync');

module.exports = function(){

  // Bash the cache for scheduled posts
  cacheScheduler(function(stat){
    console.log(stat);
  });

  // Allow new syncs to go through
  Sync.release.all(function(err){
    console.log('Reset the sync leases for all blogs...');
  });

  // Warn users about impending subscriptions
  scheduleWarningEmails(function(stat){
    console.log(stat);
  });


  console.log('Scheduled daily backups for 3am!');
  schedule({hour: 11, minute: 0}, function(){

    // Start the backup daemon
    console.log('Backup: It is 1am, time to start!');
    backup.now();
  });

  console.log('Scheduled analytics reset for 6am!');
  schedule({hour: 13, minute: 0}, function(){

    console.log('Reseting the analytics counter...');
    
    var todayKey = 'analytics:today';
    var allKey = 'analytics:all';
    var client = require('client');

    client.get(todayKey, function (err, views) {

      if (err) throw err;

      client.lpush(allKey, views, function(err){

        if (err) throw err;

        // this will effectively reset it to zero
        client.del(todayKey, function (err) {

          if (err) throw err;
          
          console.log('Reset the analytics counter.');
        });
      });
    });
  });

  // At some point I should check this doesnt consume too
  // much memory
  console.log('Scheduled daily update email for 6:05am!');
  schedule({hour: 10, minute: 5}, function(){

    console.log('Generating daily update email...');
    dailyUpdate(function(){
      console.log('Daily update email update was sent.');
    });
  });

};

function cacheScheduler (callback) {

  var totalScheduled = 0;

  Blog.getAllIDs(function(err, blogIDs){

    async.each(blogIDs, function(blogID, nextBlog){

      Entries.get(blogID, {lists: ['scheduled']}, function(err, list){

        async.each(list.scheduled, function(futureEntry, nextEntry){

          totalScheduled++;

          // Saving empty updates will call the entry scheduler
          // and ensure the entry is rebuilt again in future
          Entry.set(blogID, futureEntry.path, {}, nextEntry);

        }, function(){
          nextBlog();
        });
      });
    }, function(){

      callback('Scheduled ' + totalScheduled + ' posts to clear the cache.');
    });
  });
}

function scheduleWarningEmails(callback) {

  User.getAllIds(function(err, uids){

    var total = uids.length;
    var numberScheduled = 0;

    (function syncNextUser () {

      if (!uids.length) return callback('Warning emails scheduled for ' + numberScheduled + ' of ' + total + ' users!');

      var uid = uids.pop();

      User.getById(uid, function(err, user) {

        if (err) {
          console.log('Scheduler error:', err);
          return syncNextUser();
        }

        if (!user) {
          console.log('No user with uid', uid);
          return syncNextUser();
        }

        if (user.subscription &&
            user.subscription.current_period_end &&
            !user.subscription.cancel_at_period_end) {

          var nextBill = user.subscription.current_period_end;

          var warningDate = new Date(nextBill * 1000);
              warningDate.setDate(warningDate.getDate() - 7);

          if (warningDate.getTime() > Date.now()) {

            numberScheduled++;

            schedule(warningDate, function(){
              email.UPCOMING_RENEWAL(uid);
            });

          } else {
            console.log('Warning email already sent (hopefully) to', user.email);
          }
        }

        syncNextUser();
      });
    }());
  });
}