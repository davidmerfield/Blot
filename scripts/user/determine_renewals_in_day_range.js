var eachUser = require("../each/user");
var yesno = require("yesno");
// The number of days before a subscription is renewed or
// expired to send an email notification to the customer.
var DAYS_WARNING = 8;
var OLD_DAYS_WARNING = process.argv[2] || 7;
var email = require("helper/email");

eachUser(function (user, next) {
  // This user does not have a subscription through Stripe
  if (!user || !user.subscription || !user.subscription.current_period_end)
    return next();

  // This user has monthly billing – we don't send them a warning email since
  // 12 warning emails + 12 receipt emails per year is a little much.
  if (user.subscription.plan && user.subscription.plan.interval === "month")
    return next();

  // Stripe uses a seconds timestamp vs. JavaScript's ms
  var notificationDate = new Date(user.subscription.current_period_end * 1000);
  var oldNotificationDate = new Date(
    user.subscription.current_period_end * 1000
  );

  // Subtract the number of days warning we'd like to give to user
  // Right now we tell them a week in advance of a renewal or expiry
  notificationDate.setDate(notificationDate.getDate() - DAYS_WARNING);
  oldNotificationDate.setDate(oldNotificationDate.getDate() - OLD_DAYS_WARNING);

  // When the server starts, we schedule a notification email for every user
  // If they should have been notified in the past, we stop now since we
  // don't want to email the user more than once.
  if (notificationDate.getTime() < Date.now()) {
    if (oldNotificationDate.getTime() > Date.now()) {
      console.log(
        "Bingo!",
        user.email,
        "still needs to be notified. new notification date:",
        notificationDate,
        "old notification date:",
        oldNotificationDate
      );

      return yesno.ask("Send notification email? (y/n)", false, function (ok) {
        if (!ok) return next();
        email.UPCOMING_EXPIRY(user.uid);
        next();
      });
    }
  }

  return next();
}, process.exit);
