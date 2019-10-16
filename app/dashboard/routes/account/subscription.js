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

Subscription.route("/create")

  .all(requireLackOfSubscription)

  .get(function(req, res) {
    res.locals.price =
      "$" +
      parseInt(config.stripe.plan.split("_").pop()) * req.user.blogs.length;
    res.locals.interval =
      config.stripe.plan.indexOf("monthly") === 0 ? "month" : "year";
    res.locals.stripe_key = config.stripe.key;
    res.render("account/create-subscription", {
      title: "Create subscription",
      breadcrumb: "Create subscription"
    });
  })

  .post(createStripeSubscription, function(req, res) {
    email.CREATED_BLOG(req.user.uid);
    res.message("/account", "You created a subscription");
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

function requireLackOfSubscription(req, res, next) {
  // Make sure the user does not have a subscription
  // otherwise they might create multiple
  if (!req.user.subscription || !req.user.subscription.customer) {
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

// If I created a blog for the customer manually they will
// not have a stripe subscription. In order to create new
// blogs they will need one.
function createStripeSubscription(req, res, next) {
  console.log("body", req.body);
  stripe.customers.create(
    {
      card: req.body.stripeToken,
      email: req.user.email,
      plan: config.stripe.plan,
      quantity: req.user.blogs.length,
      description: "Blot subscription"
    },
    function(err, customer) {
      if (err) return next(err);

      User.set(req.user.uid, { subscription: customer.subscription }, next);
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
