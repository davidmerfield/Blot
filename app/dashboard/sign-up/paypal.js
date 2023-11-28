const config = require("config");
const fetch = require("node-fetch");
const User = require("models/user");
const express = require("express");
const paypal = new express.Router();

paypal.get("/", async (req, res, next) => {
  const { subscriptionID } = req.query;

  if (!subscriptionID) {
    return next(new Error("No subscription from PayPal"));
  }

  User.getByPayPalSubscriptionId(subscriptionID, async (err, user) => {
    if (err) return next(err);

    if (user && user.uid) return next(new Error("You already have an account"));

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

    const json = await response.json();

    console.log(JSON.stringify(json, null, 2));

    req.session.paypal = json;
    req.session.email = json.subscriber.email_address;

    res.redirect("/sign-up/create-account");
  });
});

module.exports = paypal;

/* here's an example json response from the sandbox 

{
  "status": "ACTIVE",
  "status_update_time": "2023-11-28T15:21:13Z",
  "id": "I-7YE8TE6RC0VM",
  "plan_id": "P-7HX61711C4313363XMVSMQIY",
  "start_time": "2023-11-28T15:20:43Z",
  "quantity": "1",
  "shipping_amount": {
    "currency_code": "USD",
    "value": "0.0"
  },
  "subscriber": {
    "email_address": "customer@blot.im",
    "payer_id": "PA4HN29Q536Y6",
    "name": {
      "given_name": "David",
      "surname": "Customer"
    },
    "shipping_address": {
      "address": {
        "address_line_1": "1 Main St",
        "admin_area_2": "San Jose",
        "admin_area_1": "CA",
        "postal_code": "95131",
        "country_code": "US"
      }
    }
  },
  "billing_info": {
    "outstanding_balance": {
      "currency_code": "USD",
      "value": "0.0"
    },
    "cycle_executions": [
      {
        "tenure_type": "REGULAR",
        "sequence": 1,
        "cycles_completed": 1,
        "cycles_remaining": 0,
        "current_pricing_scheme_version": 1,
        "total_cycles": 0
      }
    ],
    "last_payment": {
      "amount": {
        "currency_code": "USD",
        "value": "4.0"
      },
      "time": "2023-11-28T15:21:12Z"
    },
    "next_billing_time": "2023-12-28T10:00:00Z",
    "failed_payments_count": 0
  },
  "auto_renewal": true,
  "create_time": "2023-11-28T15:21:11Z",
  "update_time": "2023-11-28T15:21:13Z",
  "plan_overridden": false,
  "links": [
    {
      "href": "https://api.sandbox.paypal.com/v1/billing/subscriptions/I-7YE8TE6RC0VM/cancel",
      "rel": "cancel",
      "method": "POST"
    },
    {
      "href": "https://api.sandbox.paypal.com/v1/billing/subscriptions/I-7YE8TE6RC0VM",
      "rel": "edit",
      "method": "PATCH"
    },
    {
      "href": "https://api.sandbox.paypal.com/v1/billing/subscriptions/I-7YE8TE6RC0VM",
      "rel": "self",
      "method": "GET"
    },
    {
      "href": "https://api.sandbox.paypal.com/v1/billing/subscriptions/I-7YE8TE6RC0VM/suspend",
      "rel": "suspend",
      "method": "POST"
    },
    {
      "href": "https://api.sandbox.paypal.com/v1/billing/subscriptions/I-7YE8TE6RC0VM/capture",
      "rel": "capture",
      "method": "POST"
    }
  ]
}
*/
