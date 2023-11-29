var amountInWords = require("helper/amountInWords");
var prettyDate = require("helper/prettyDate");
var prettyPrice = require("helper/prettyPrice");
var config = require("config");

module.exports = function extend (user) {
  // True if the user has set a password, false otherwise
  user.hasPassword = !!user.passwordHash;

  // Don't expose these to the
  // view renderer
  delete user.credentials;
  delete user.passwordHash;

  user.pretty = {};

  var subscription = user.subscription;

  if (subscription) {
    if (subscription.plan) {
      user.pretty.amount = subscription.quantity;
      user.pretty.s = subscription.quantity === 1 ? "" : "s";
      user.pretty.amount_in_words = amountInWords(subscription.quantity);
      user.pretty.expiry = prettyDate(subscription.current_period_end * 1000);
      user.pretty.price = prettyPrice(
        subscription.plan.amount * subscription.quantity
      );
      user.isMonthly = subscription.plan.interval === "month";
    }

    if (subscription.cancel_at_period_end) user.cancel_at_period_end = true;

    if (
      (!subscription.cancel_at_period_end &&
        subscription.status === "active") ||
      subscription.status === "trialing"
    )
      user.isSubscribed = true;

    if (subscription.cancel_at_period_end) user.willCancel = true;

    if (!subscription.customer && !user.paypal.status)
      user.isFreeForLife = true;

    if (subscription.status === "unpaid") user.isUnpaid = true;

    if (subscription.status === "past_due") user.isPastDue = true;

    if (subscription.status === "canceled") user.isDisabled = true;

    if (user.isUnpaid || user.isPastDue) user.needsToPay = true;
  }

  if (user.paypal && user.paypal.status) {
    console.log(JSON.stringify(user.paypal, null, 2));

    if (user.paypal.status === "ACTIVE") user.isSubscribed = true;

    if (user.paypal.status === "CANCELLED") user.willCancel = true;

    const plan_identifier = Object.keys(config.paypal.plans).find(
      identifier => config.paypal.plans[identifier] === user.paypal.plan_id
    );

    const amount = plan_identifier.includes("monthly") ? 400 : 4400;

    const quantity = parseInt(user.paypal.quantity);

    user.isMonthly = plan_identifier.includes("monthly");
    user.pretty.amount = quantity;
    user.pretty.s = quantity === 1 ? "" : "s";
    user.pretty.amount_in_words = amountInWords(quantity);

    // if the user has cancelled their subscription, next_billing_time will be null
    user.pretty.expiry = user.paypal.billing_info.next_billing_time
      ? prettyDate(
          new Date(user.paypal.billing_info.next_billing_time).getTime()
        )
      : prettyDate(
          new Date(user.paypal.billing_info.last_payment.time).getTime() +
            plan_identifier.includes("monthly")
            ? 30 * 24 * 60 * 60 * 1000
            : 365 * 24 * 60 * 60 * 1000
        );

    user.pretty.price = prettyPrice(amount * quantity);
  }

  if (user.blogs.length !== 1) {
    user.multipleBlogs = true;
    user.s = "s"; // used like this: you run blog{{s}} on blot...
    user.are = "are";
  } else {
    user.multipleBlogs = false;
    user.s = "";
    user.are = "is";
  }

  return user;
};
