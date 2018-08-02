var Express = require("express");
var Subscription = new Express.Router();
var User = require("user");
var config = require("config");
var User = require("user");
var stripe = require("stripe")(config.stripe.secret);
var email = require("email");

Subscription.route("/cancel")

  .all(requireSubscription)

  .get(function(req, res) {
    res.render("account/cancel", {
      title: "Cancel your subscription",
      subpage_title: "Cancel subscription",
      subpage_slug: "cancel"
    });
  })

  .post(cancelStripeSubscription, function(req, res) {
    email.CANCELLED(req.user.uid);
    res.message("/account", "Your subscription has been cancelled");
  });

Subscription.route("/restart")

  .all(requireCancelledSubscription)

  .get(function(req, res) {
    res.render("account/restart", {
      title: "Restart your subscription",
      subpage_title: "Restart",
      subpage_slug: "restart"
    });
  })

  .post(restartStripeSubscription, function(req, res) {
    email.RESTART(req.user.uid);
    res.message("/account", 'Restarted your subscription');
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
  } else {
    res.redirect("/account/restart");
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
