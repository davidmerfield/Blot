var helper = require("helper");
var amountInWords = helper.amountInWords;

module.exports = function extend(user) {
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
      user.pretty.expiry = helper.prettyDate(
        subscription.current_period_end * 1000
      );
      user.pretty.price = helper.prettyPrice(
        subscription.plan.amount * subscription.quantity
      );
    }

    if (subscription.cancel_at_period_end) user.cancel_at_period_end = true;

    if (
      (!subscription.cancel_at_period_end &&
        subscription.status === "active") ||
      subscription.status === "trialing"
    )
      user.isSubscribed = true;

    if (!subscription.customer) user.isFreeForLife = true;

    if (subscription.status === "unpaid") user.isUnpaid = true;

    if (subscription.status === "past_due") user.isPastDue = true;

    if (subscription.status === "canceled") user.isDisabled = true;

    if (user.isUnpaid || user.isPastDue) user.needsToPay = true;
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
