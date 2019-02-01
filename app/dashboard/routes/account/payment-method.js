var Express = require("express");
var PaymentMethod = new Express.Router();

var config = require("config");
var email = require("helper").email;
var stripe = require("stripe")(config.stripe.secret);
var User = require("user");

// The purpose of this page is to allow the user to update the
// card used by Stripe to charge their subscription fee
PaymentMethod.route("/")

  .all(function(req, res, next) {
    // User does not have a payment method on file, so redirect them
    if (!req.user || !req.user.subscription || !req.user.subscription.plan)
      return res.redirect("/account");

    return next();
  })

  .get(function(req, res) {
    res.render("account/payment-method", {
      stripe_key: config.stripe.key,
      breadcrumb: "Edit payment method",
      title: "Edit payment information"
    });
  })

  .post(function(req, res, next) {
    // Stripe generates a token for a payment method
    // on the client. This token is passed to Blot
    // through the update payment method form. We store
    // this token to authenticate future charges.
    if (!req.body.stripeToken) {
      return next(new Error("No Stripe token"));
    }

    // We now store the new card token against the existing
    // subscription information for this customer
    stripe.customers.updateSubscription(
      req.user.subscription.customer,
      req.user.subscription.id,
      { card: req.body.stripeToken, quantity: req.user.subscription.quantity },
      function(err, subscription) {
        if (err) return next(err);

        if (subscription) req.latestSubscription = subscription;

        next();
      }
    );
  })

  // Sometimes, somehow, a customer is deleted on Stripe
  // but the Blot account exists. Not sure exactly what
  // causes this but it happened. This middleware will
  // create a new subscription and customer, without
  // charging the new payment information and then store
  // it against this blot user.
  .post(function(err, req, res, next) {
    // This is some other error, proceed.
    if (err.code !== "resource_missing") {
      return next(err);
    }

    // Make sure we use the user's old suscription
    // plan, in case Blot's price for new customers
    // has changed since they signed up.
    // Setting the quantity to zero will ensure the
    // customer is not charged right now.
    stripe.customers.create(
      {
        card: req.body.stripeToken,
        email: req.user.email,
        plan: req.user.subscription.plan.id,
        quantity: 0,
        description: "Blot subscription"
      },
      function(err, customer) {
        if (err) return next(err);

        // Now we ensure the new subscription has the correct
        // quantity. We couldn't do this earlier because it
        // would involve incorrectly charging the customer. If
        // we set prorate to false, they won't be charged now.
        stripe.customers.updateSubscription(
          customer.subscription.customer,
          customer.subscription.id,
          { quantity: req.user.blogs.length || 1, prorate: false },
          function(err, subscription) {
            if (err) return next(err);

            if (subscription) req.latestSubscription = subscription;

            next();
          }
        );
      }
    );
  })

  // This middleware will save a valid, updated
  // subscription with the new payment method.
  .post(function(req, res, next) {
    if (!req.latestSubscription) return next(new Error("No subscription"));

    User.set(req.user.uid, { subscription: req.latestSubscription }, function(
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
