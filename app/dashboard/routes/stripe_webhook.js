var parser = require("body-parser");
var Express = require("express");
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);
var email = require("helper").email;
var User = require("user");

var webhooks = Express.Router();

// Stripe event codes
var UPDATED_SUBSCRIPTION = "customer.subscription.updated";

// Error messages
var NO_SUBSCRIPTION = "No subscription retrieved from Stripe";
var NO_USER = "No user retrieved from the database";

// Stripe sends us a webhook when user subscriptions change
// Some reasons they might change:
// - Renewal payment fails
// - I make some change to a user subscription directly on the
//   Stripe dashboard, this webhook tells Blot to pull the latest
//   state from Stripe.
// - There are probably other things I'm missing....

webhooks.post("/", parser.json(), function(req, res) {
  // Down for maintenance, Stripe should
  // back off and try again later.
  if (config.maintenance) return res.sendStatus(503);

  var event = req.body;
  var event_data = event.data.object;

  // A customer's subscription was changed, save changed info
  if (event.type === UPDATED_SUBSCRIPTION)
    update_subscription(event_data.customer, event_data.id, function() {});

  return res.sendStatus(200);
});

function update_subscription(customer_id, subscription_id, callback) {
  stripe.customers.retrieveSubscription(customer_id, subscription_id, function(
    err,
    subscription
  ) {
    if (err || !subscription)
      return callback(err || new Error(NO_SUBSCRIPTION));

    User.getByCustomerId(customer_id, function(err, user) {
      if (err || !user) return callback(err || new Error(NO_USER));

      if (subscription.status === "canceled" && user.isDisabled)
        email.ALREADY_CANCELLED(user.uid);

      if (subscription.status === "canceled" && !user.isDisabled)
        email.CLOSED(user.uid);

      if (subscription.status === "past_due") email.OVERDUE(user.uid);

      if (
        subscription.status === "active" &&
        (user.subscription.status === "past_due" ||
          subscription.status === "unpaid")
      )
        email.RECOVERED(user.uid);

      if (subscription.status === "unpaid") email.OVERDUE_CLOSURE(user.uid);

      User.set(user.uid, { subscription: subscription }, callback);
    });
  });
}

module.exports = webhooks;
