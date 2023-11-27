const config = require("config");
const fetch = require("node-fetch");

const express = require("express");
const paypal = new express.Router();

paypal.get("/", async (req, res, next) => {
  const { subscription_id } = req.query;

  if (!subscription_id) {
    return next(new Error("No subscription from PayPal"));
  }

  const response = await fetch(
    `${config.paypal.api_base}/v1/billing/subscriptions/${subscription_id}`,
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

  const json = await response.json();

  req.session.paypal = json;
  req.session.email = json.subscriber.email_address;

  res.redirect("/sign-up/create-account");
});

module.exports = paypal;
