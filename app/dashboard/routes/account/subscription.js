var Express = require("express");
var Subscription = new Express.Router();
var User = require("user");
var config = require("config");
var User = require("user");
var stripe = require("stripe")(config.stripe.secret);
var email = require("helper").email;

Subscription.route("/cancel")

  .all(requireSubscription)

  .get(function(req, res) {
    res.render("account/cancel", {
      title: "Cancel your subscription",
      breadcrumb: "Cancel subscription"
    });
  })

  .post(cancelStripeSubscription, function(req, res) {
    email.CANCELLED(req.user.uid);
    res.message("/account", "Your subscription has been cancelled");
  });

Subscription.route("/restart")

  .all(retrieveSubscription)

  .all(requireCancelledSubscription)

  .get(function(req, res) {
    res.render("account/restart", {
      title: "Restart your subscription",
      breadcrumb: "Restart"
    });
  })

  .post(restartStripeSubscription, function(req, res) {
    email.RESTART(req.user.uid);
    res.message("/account", "Restarted your subscription");
  });

Subscription.route("/restart/pay")

  .all(requireCancelledSubscription)

  .get(function(req, res) {
    res.render("account/restart-pay", {
      title: "Restart your subscription",
      stripe_key: config.stripe.key,
      breadcrumb: "Restart"
    });
  })

  .post(recreateStripeSubscription, function(req, res) {
    email.RESTART(req.user.uid);
    res.message("/account", "Restarted your subscription");
  });

function requireCancelledSubscription(req, res, next) {
  // Make sure the user has a subscription
  // otherwise they have nothing to cancel
  if (!req.user.isSubscribed) {
    next();
  } else {
    res.redirect("/account");
  }
}

function requireSubscription(req, res, next) {
  // Make sure the user has a subscription
  // otherwise they have nothing to cancel
  if (req.user.isSubscribed) {
    next();
  } else if (req.user.subscription && req.user.subscription.customer) {
    res.redirect("/account/restart");
  } else {
    res.redirect("/account");
  }
}

function cancelStripeSubscription(req, res, next) {
  stripe.customers.cancelSubscription(
    req.user.subscription.customer,
    req.user.subscription.id,
    { at_period_end: true },
    function(err, subscription) {
      if (err) return next(err);

      if (!subscription) return next(new Error("No subscription"));

      User.set(req.user.uid, { subscription: subscription }, next);
    }
  );
}

// If the customer's subscription has expired it will
// not be possible for them to restart it. Instead
// we create a new one for them.
function recreateStripeSubscription(req, res, next) {
  stripe.customers.update(
    req.user.subscription.customer,
    {
      card: req.body.stripeToken
    },
    function(err) {
      if (err) return next(err);

      stripe.customers.createSubscription(
        req.user.subscription.customer,
        {
          plan: req.user.subscription.plan.id,
          quantity: req.user.subscription.quantity || 1
        },
        function(err, subscription) {
          if (err || !subscription) {
            return next(err || new Error("No subscription"));
          }

          User.set(req.user.uid, { subscription: subscription }, next);
        }
      );
    }
  );
}

function retrieveSubscription(req, res, next) {
  stripe.customers.retrieveSubscription(
    req.user.subscription.customer,
    req.user.subscription.id,
    function(err, subscription) {
      if (err && err.code === "resource_missing") {
        return res.redirect("/account/subscription/restart/pay");
      }

      if (err) return next(err);

      if (!subscription) return next(new Error("No subscription"));

      User.set(req.user.uid, { subscription: subscription }, function(err) {
        if (err) return next(err);

        next();
      });
    }
  );
}

function restartStripeSubscription(req, res, next) {
  stripe.customers.updateSubscription(
    req.user.subscription.customer,
    req.user.subscription.id,
    {},
    function(err, subscription) {
      if (err) {
        return next(err);
      }

      if (!subscription) {
        return next(new Error("No subscription"));
      }

      User.set(req.user.uid, { subscription: subscription }, next);
    }
  );
}

module.exports = Subscription;
