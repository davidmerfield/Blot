var Entries = require("./models/entries");
var Entry = require("./models/entry");
var User = require("./models/user");
var email = require("helper").email;
var async = require("async");
var schedule = require("node-schedule").scheduleJob;
var Blog = require("./models/blog");
var backup = require("./backup");
var dailyUpdate = require("../scripts/info/dailyUpdate");
var debug = require("debug")("blot:scheduler");

module.exports = function() {
  // Bash the cache for scheduled posts
  cacheScheduler(function(stat) {
    console.log(stat);
  });

  // Warn users about impending subscriptions
  User.getAllIds(function(err, uids) {
    if (err) return callback(err);

    async.each(uids, User.scheduleSubscriptionEmail, function(err) {
      if (err) {
        console.error("Error scheduling subscription emails:", err);
      } else {
        console.log("Scheduled emails for renewals and expiries!");
      }
    });
  });

  console.log("Scheduled daily backups for 3am!");
  schedule({ hour: 11, minute: 0 }, function() {
    // Start the backup daemon
    console.log("Backup: It is 1am, time to start!");
    backup.now();
  });

  console.log("Scheduled analytics reset for 6am!");
  schedule({ hour: 13, minute: 0 }, function() {
    console.log("Reseting the analytics counter...");

    var todayKey = "analytics:today";
    var allKey = "analytics:all";
    var client = require("client");

    client.get(todayKey, function(err, views) {
      if (err) throw err;

      client.lpush(allKey, views, function(err) {
        if (err) throw err;

        // this will effectively reset it to zero
        client.del(todayKey, function(err) {
          if (err) throw err;

          console.log("Reset the analytics counter.");
        });
      });
    });
  });

  // At some point I should check this doesnt consume too
  // much memory
  console.log("Scheduled daily update email for 6:05am!");
  schedule({ hour: 10, minute: 5 }, function() {
    console.log("Generating daily update email...");
    dailyUpdate(function() {
      console.log("Daily update email update was sent.");
    });
  });
};

function cacheScheduler(callback) {
  var totalScheduled = 0;

  Blog.getAllIDs(function(err, blogIDs) {
    async.each(
      blogIDs,
      function(blogID, nextBlog) {
        Entries.get(blogID, { lists: ["scheduled"] }, function(err, list) {
          async.each(
            list.scheduled,
            function(futureEntry, nextEntry) {
              totalScheduled++;

              // Saving empty updates will call the entry scheduler
              // and ensure the entry is rebuilt again in future
              Entry.set(blogID, futureEntry.path, {}, nextEntry);
            },
            function() {
              nextBlog();
            }
          );
        });
      },
      function() {
        callback("Scheduled " + totalScheduled + " posts to clear the cache.");
      }
    );
  });
}
