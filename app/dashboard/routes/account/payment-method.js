var Express = require("express");
var PaymentMethod = new Express.Router();

var config = require("config");
var email = require("helper").email;
var stripe = require("stripe")(config.stripe.secret);
var User = require("user");

PaymentMethod.route("/")

  .all(function(req, res, next) {
    // User doesnt need to pay
    if (req.user.isFreeForLife) return res.redirect("/account");

    return next();
  })

  .get(function(req, res) {
    // If user is new or doesn't have a handle,
    // let them choose one
    res.render("account/payment-method", {
      stripe_key: config.stripe.key,
      breadcrumb: "Edit payment method",
      title: "Edit payment information"
    });
  })

  // Takes a stripe token generated
  // on the client and creates a charge
  .post(function(req, res, next) {
    var user = req.user;

    var stripeToken = req.body.stripeToken;

    if (!stripeToken) return next(new Error("No Stripe token"));

    stripe.customers.updateSubscription(
      user.subscription.customer,
      user.subscription.id,
      { card: stripeToken, quantity: user.subscription.quantity },
      function(err, subscription) {
        if (err) return next(err);

        if (subscription) req.newSubscription = subscription;

        next();
      }
    );
  })

  // Handle deleted customer edge case
  .post(function(err, req, res, next) {
    if (err.code !== "resource_missing") {
      return next(err);
    }

    var card = req.body && req.body.stripeToken;
    var email = req.user.email;
    var plan = req.user.subscription.plan.id;

    if (!card) return next(new Error("No card"));
    if (!plan) return next(new Error("No plan"));

    var info = {
      card: card,
      email: email,
      plan: plan,
      quantity: 0,
      description: "Blot subscription"
    };

    stripe.customers.create(info, function(err, customer) {
      if (err) return next(err);

      stripe.customers.updateSubscription(
        customer.subscription.customer,
        customer.subscription.id,
        { quantity: req.user.blogs.length || 1, prorate: false },
        function(err, subscription) {
          if (err) return next(err);

          if (subscription) req.newSubscription = subscription;

          next();
        }
      );
    });
  })

  .post(function(req, res, next) {
    if (!req.newSubscription) return next(new Error("No subscription"));

    User.set(req.user.uid, { subscription: req.newSubscription }, function(
      err
    ) {
      if (err) return next(err);

      email.UPDATE_BILLING(req.user.uid);
      res.message(
        "/account",
        "Your payment information was updated successfully!"
      );
    });
  });

module.exports = PaymentMethod;
