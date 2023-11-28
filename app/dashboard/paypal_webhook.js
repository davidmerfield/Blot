const express = require("express");
const paypal = new express.Router();
const parser = require("body-parser");
const User = require("models/user");
const config = require("config");
const clfdate = require("helper/clfdate");

const SUBSCRIPTION_EVENTS = [
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "BILLING.SUBSCRIPTION.RE-ACTIVATED",
  "BILLING.SUBSCRIPTION.UPDATED",
  "BILLING.SUBSCRIPTION.CREATED"
];

const prefix = () => `${clfdate()} PayPal Webhook:`;

paypal.post("/", parser.json(), (req, res) => {
  // if the webhook is for a subscription-related event
  // update the subscription
  if (SUBSCRIPTION_EVENTS.includes(req.body.event_type)) {
    // pass the subscription ID to the updateSubscription function
    console.log(prefix(), req.body.event_type, req.body.resource.id);

    updateSubscription(req.body.resource.id, err => {
      if (err) return console.log(prefix(), err);
      console.log(prefix(), "UPDATED SUBSCRIPTION");
    });
  } else {
    console.log(
      prefix(),
      "UNHANDLED PAYPAL WEBHOOK EVENT",
      req.body.event_type
    );
  }

  res.status(200).send("OK");
});

const updateSubscription = (subscriptionID, callback) => {
  console.log(prefix(), "UPDATING SUBSCRIPTION", subscriptionID);

  User.getByPayPalSubscriptionId(subscriptionID, async (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(new Error("No user found for paypal ID"));
    const response = await fetch(
      `${config.paypal.api_base}/v1/billing/subscriptions/${subscriptionID}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": "en_US",
          "Authorization": `Basic ${Buffer.from(
            `${config.paypal.client_id}:${config.paypal.secret}`
          ).toString("base64")}`
        }
      }
    );

    const paypal = await response.json();

    console.log(prefix(), "Saving user", user.uid, "with paypal", paypal);
    User.set(user.uid, { paypal }, callback);
  });
};

module.exports = paypal;
