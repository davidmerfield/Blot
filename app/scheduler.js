var Entries = require("./models/entries");
var Entry = require("./models/entry");
var User = require("./models/user");
var async = require("async");
var schedule = require("node-schedule").scheduleJob;
var Blog = require("./models/blog");
var backup = require("./backup");
var dailyUpdate = require("./scheduler/daily");
var helper = require("helper");
var email = helper.email;

module.exports = function() {
  // Bash the cache for scheduled posts
  cacheScheduler(function(stat) {
    console.log(stat);
  });

  // Warn users about impending subscriptions
  User.getAllIds(function(err, uids) {
    async.each(uids, User.scheduleSubscriptionEmail, function(err) {
      if (err) {
        console.error("Error scheduling subscription emails:", err);
      } else {
        console.log("Scheduled emails for renewals and expiries!");
      }
    });
  });

  console.log("Scheduled daily check of storage disk usage for 6am!");
  schedule({ hour: 10, minute: 0 }, function() {
    console.log("Scheduler: Checking available disk space");

    require("child_process").exec("df -h", function(err, stdout) {
      if (err) throw err;

      var disk = stdout
        .split("\n")[1]
        .replace(/\s+/g, " ")
        .split(" ");
      var usage = disk[4];
      var available = disk[3];

      if (parseInt(usage) < 90) {
        console.log(
          "Scheduler: Disk usage check passed! Usage:",
          usage,
          "Space available:",
          available
        );
        return;
      }

      console.log(
        "Scheduler: Disk usage check failed! Usage:",
        usage,
        "Space available:",
        available
      );

      email.WARNING_LOW_DISK_SPACE(
        null,
        { usage: usage, available: available },
        function(err) {
          if (err) console.log(err);
        }
      );
    });
  });

  console.log("Scheduled daily backups for 3am!");
  schedule({ hour: 11, minute: 0 }, function() {
    // Start the backup daemon
    console.log("Backup: It is 1am, time to start!");
    backup.now();
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
