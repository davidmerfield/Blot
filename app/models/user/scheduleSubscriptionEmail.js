var getById = require("./getById");
var email = require("helper").email;
var debug = require("debug")("blot:user:scheduleSubscriptionEmail");
var schedule = require("node-schedule").scheduleJob;

// The number of days before a subscription is renewed or
// expired to send an email notification to the customer.
var DAYS_WARNING = 7;

module.exports = function(uid, callback) {
  getById(uid, function(err, user) {
    if (err) return callback(err);

    var notificationDate;

    // This user does not have a subscription through Stripe
    if (!user || !user.subscription || !user.subscription.current_period_end)
      return callback();

    notificationDate = new Date(user.subscription.current_period_end * 1000);
    notificationDate.setDate(notificationDate.getDate() - DAYS_WARNING);

    debug(user.uid, user.email, "needs to be notified on", notificationDate);

    // The notification date has passed
    if (notificationDate.getTime() < Date.now()) {
      debug(
        user.uid,
        user.email,
        "should already have been notified on",
        notificationDate
      );
      return callback();
    }

    // Schedule the email
    debug(user.uid, user.email, "scheduling warning email....");
    schedule(notificationDate, function() {
      // We fetch the latest state of the user's subscription
      // from the database in case the user's subscription
      // has changed since the time the server started.
      getById(uid, function(err, user) {
        debug(user.id, user.email, "Time to notify the user!");

        if (!user || !user.subscription) {
          return;
        }

        if (user.subscription.cancel_at_period_end) {
          debug(
            user.uid,
            user.email,
            "Sending email about a subscription expiry..."
          );
          return email.UPCOMING_EXPIRY(uid);
        }

        if (user.subscription.status === "active") {
          debug(
            user.uid,
            user.email,
            "Sending email about a subscription renewal..."
          );
          return email.UPCOMING_RENEWAL(uid);
        }

        debug(user.uid, user.email, "Not sure how to notify this user!");
      });
    });

    // Let the callee know the email is schedule
    callback();
  });
};
