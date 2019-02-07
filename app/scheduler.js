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

// The number of days before a subscription is renewed or
// expired to send an email notification to the customer.
var DAYS_WARNING = 7;

module.exports = function() {
  // Bash the cache for scheduled posts
  cacheScheduler(function(stat) {
    console.log(stat);
  });

  // Warn users about impending subscriptions
  scheduleSubscriptionEmails(function(stat) {
    console.log(stat);
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

function scheduleSubscriptionEmails(callback) {
  User.getAllIds(function(err, uids) {
    if (err) return callback(err);

    async.map(uids, User.getById, function(err, users) {
      if (err) return callback(err);

      async.each(
        users,
        function(user, next) {
          var notificationDate;

          // This user does not have a subscription through Stripe
          if (
            !user ||
            !user.subscription ||
            !user.subscription.current_period_end
          )
            return next();

          notificationDate = new Date(
            user.subscription.current_period_end * 1000
          );
          notificationDate.setDate(notificationDate.getDate() - DAYS_WARNING);

          debug(user.uid, user.email, "will be notified on", notificationDate);

          // The notification date has passed
          if (notificationDate.getTime() < Date.now()) {
            debug(
              user.uid,
              user.email,
              "should already have been notified on",
              notificationDate
            );
            return next();
          }

          // Schedule the email
          debug(user.uid, user.email, "scheduling warning email....");
          schedule(notificationDate, notificationEmail(user.uid));
        },
        callback
      );
    });
  });
}

function notificationEmail(uid) {
  return function() {
    // We fetch the latest state of the user's subscription
    // from the database in case the user's subscription
    // has changed since the time the server started.
    User.getById(uid, function(err, user) {
      debug(user.id, user.email, "Time to notify the user!");
      if (
        user &&
        user.subscription &&
        user.subscription.cancel_at_period_end === true
      ) {
        debug(
          user.uid,
          user.email,
          "Sending email about a subscription expiry..."
        );
        email.UPCOMING_EXPIRY(uid);
      } else if (
        user &&
        user.subscription &&
        user.subscription.cancel_at_period_end === false
      ) {
        debug(
          user.uid,
          user.email,
          "Sending email about a subscription renewal..."
        );
        email.UPCOMING_RENEWAL(uid);
      } else {
        debug(user.uid, user.email, "Not sure how to notify this user!");
      }
    });
  };
}
