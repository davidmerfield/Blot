var config = require("config");
var async = require("async");
var stripe = require("stripe")(config.stripe.secret);
var User = require("user");
var Express = require("express");
var PaySubscription = new Express.Router();

PaySubscription.route("/")
  .get(checkCustomer)
  .get(loadUnpaidInvoices)
  .get(function(req, res) {
    res.render("account/pay-subscription", {
      stripe_key: config.stripe.key,
      title: 'Restart subscription'
    });
  })
  .get(function(err, req, res, next){
    updateSubscription(req, res, function(err){

      if (err) return next(err);

      res.message("/", "Your account is in good standing!");
    });
  })


  .post(checkCustomer)
  .post(updateCard)
  .post(payInvoices)
  .post(updateSubscription)
  .post(function(req, res) {
    res.message("/", "Payment recieved, thank you!");
  });

function checkCustomer(req, res, next) {
  req.customer = req.user.subscription && req.user.subscription.customer;
  req.subscription = req.user.subscription && req.user.subscription.id;

  if (!req.customer) return next(new Error("You need to be a customer"));
  if (!req.subscription)
    return next(new Error("You need to have a subscription"));

  next();
}

function loadUnpaidInvoices(req, res, next) {
  stripe.invoices.list({ customer: req.customer }, function(err, invoices) {
    if (err) return next(err);

    res.locals.unpaidInvoices = [];

    invoices.data.forEach(function(invoice) {
      if (invoice.paid) return;
      res.locals.unpaidInvoices.push(invoice);
    });

    if (!res.locals.unpaidInvoices.length) {
      return next(new Error("You have paid all of your invoices."));
    }

    next();
  });
}

function updateCard(req, res, next) {
  var stripeToken = req.body.stripeToken;

  if (!stripeToken) return next(new Error("No card token passed"));

  stripe.customers.update(req.customer, { card: stripeToken }, function(
    err,
    customer
  ) {
    if (err) return next(err);

    if (customer.subscription.status === "active") {
      return next(new Error("You are in good standing, nothing to pay"));
    }

    next();
  });
}

function payInvoices(req, res, next) {
  async.each(req.body.unpaidInvoices, payInvoice, next);
}

function payInvoice(id, nextInvoice) {
  stripe.invoices.pay(id, nextInvoice);
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