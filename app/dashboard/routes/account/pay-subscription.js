var config = require("config");
var async = require("async");
var stripe = require("stripe")(config.stripe.secret);
var User = require("user");
var Express = require("express");
var PaySubscription = new Express.Router();
var debug = require("debug")("blot:dashboard:pay-subscription");

PaySubscription.route("/")

  // First, make sure the customer has a subscription
  // through Stripe, then fetch the latest state of
  // their subscription from Stripe and finally fetch
  // any unpaid invoices.
  .all(checkCustomer)
  .all(updateSubscription)

  .get(listUnpaidInvoices)
  .get(function(req, res) {
    res.render("account/pay-subscription", {
      stripe_key: config.stripe.key,
      title: "Restart subscription"
    });
  })

  .post(updateCard)
  .post(payUnpaidInvoices)
  .post(function(req, res) {
    res.message("/", "Payment recieved, thank you!");
  });

function checkCustomer(req, res, next) {
  req.customer = req.user.subscription && req.user.subscription.customer;
  req.subscription = req.user.subscription && req.user.subscription.id;

  if (!req.customer) {
    return res.message("/", "You are not a customer!");
  }

  if (!req.subscription) {
    return res.message("/", "You need to have a subscription!");
  }

  next();
}

function listUnpaidInvoices(req, res, next) {
  stripe.invoices.list({ customer: req.customer }, function(err, invoices) {
    if (err) return next(err);

    res.locals.amountDue = 0;

    invoices.data.forEach(function(invoice) {
      if (invoice.paid === false) res.locals.amountDue += invoice.amount_due;
    });

    if (!res.locals.amountDue) {
      return res.message("/", "Thank you, your account is in good standing!");
    }

    res.locals.amountDue = require("helper").prettyPrice(res.locals.amountDue);

    next();
  });
}

function updateCard(req, res, next) {
  var stripeToken = req.body.stripeToken;

  if (!stripeToken) return next(new Error("No card token passed"));

  stripe.customers.update(req.customer, { card: stripeToken }, next);
}

function payUnpaidInvoices(req, res, next) {
  stripe.invoices.list({ customer: req.customer }, function(err, invoices) {
    if (err) return next(err);

    async.each(
      invoices.data,
      function(invoice, nextInvoice) {
        if (invoice.paid) return nextInvoice();

        // You can only pay an invoice once
        stripe.invoices.pay(invoice.id, nextInvoice);
      },
      next
    );
  });
}

function updateSubscription(req, res, next) {
  stripe.customers.retrieveSubscription(
    req.user.subscription.customer,
    req.user.subscription.id,
    function(err, subscription) {
      if (err) return next(err);

      if (!subscription) return next(new Error("No subscription"));

      User.set(req.user.uid, { subscription: subscription }, function(err) {
        if (err) return next(err);

        next();
      });
    }
  );
}

module.exports = PaySubscription;
