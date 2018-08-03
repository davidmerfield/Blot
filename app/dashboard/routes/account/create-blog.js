var Express = require("express");
var CreateBlog = new Express.Router();

var Blog = require("blog");
var helper = require("helper");
var pretty = helper.prettyPrice;
var config = require("config");
var handleValidator = require("../../../models/blog/validate/handle");
var helper = require("helper");
var pretty = helper.prettyPrice;

var config = require("config");
var stripe = require("stripe")(config.stripe.secret);
var User = require("user");

var BAD_CHARGE = "Could not charge your card.";
var ERR = "Could not change your subscription.";

CreateBlog.route("/")

  .all(validateSubscription, calculateFee)

  .get(function(req, res) {
    res.render("account/create-blog", {
      title: "Create a blog",
      subpage_slug: "create-blog",
      subpage_title: "Create a blog"
    });
  })

  .post(
    validateHandle,
    chargeForRemaining,
    updateSubscription,
    saveBlog,
    function(req, res) {
      res.redirect("/");
    }
  )

function calculateFee(req, res, next) {
  var subscription = req.user.subscription;
  var end = subscription.current_period_end;
  var start = subscription.current_period_start;
  var individual = subscription.plan.amount;

  var remaining = end * 1000 - Date.now();
  var length = (end - start) * 1000;

  var ratioToGo = remaining / length;

  var now = Math.round(ratioToGo * individual);
  var later =
    subscription.plan.amount * subscription.quantity + subscription.plan.amount;

  // This is used by the charge function so if you change it, also
  // change the charge function
  req.amount_due_now = now;

  res.locals.now = pretty(now);
  res.locals.later = pretty(later);
  res.locals.individual = pretty(individual);
  res.locals.first_blog =
    req.user.blogs.length === 0 && req.user.subscription.quantity === 1;

  next();
}

function validateSubscription(req, res, next) {
  var subscription = req.user.subscription;

  if (
    !subscription ||
    !subscription.status ||
    subscription.status !== "active"
  ) {
    next(new Error("You must have an active subscription to create a blog"));
  } else {
    next();
  }
}

function validateHandle(req, res, next) {
  // We pass an empty string to handle validator
  // since we don't know the ID of the blog yet
  handleValidator("", req.body.handle, function(err, handle) {
    if (err) {
      next(err);
    } else {
      req.body.handle = handle;
      next();
    }
  });
}

function saveBlog(req, res, next) {
  Blog.create(
    req.user.uid,
    {
      handle: req.body.handle,
      timeZone: req.body.timeZone
    },
    function(err, blog) {
      if (err) return next(err);

      // Switch to the new blog
      req.session.blogID = blog.id;

      next();
    }
  );
}

function updateSubscription(req, res, next) {
  // This is their first blog, so don't charge the user twice
  if (req.user.blogs.length === 0 && req.user.subscription.quantity === 1) {
    return next();
  }

  stripe.customers.updateSubscription(
    req.user.subscription.customer,
    req.user.subscription.id,
    {
      quantity: req.user.blogs.length + 1,
      prorate: false
    },
    function(err, subscription) {
      if (err) return next(err);

      if (!subscription) return next(new Error(ERR));

      User.set(req.user.uid, { subscription: subscription }, next);
    }
  );
}

function chargeForRemaining(req, res, next) {
  // This is their first blog, so don't charge the user twice
  if (req.user.blogs.length === 0 && req.user.subscription.quantity === 1) {
    return next();
  }

  stripe.charges.create(
    {
      amount: req.amount_due_now,
      currency: "usd",
      customer: req.user.subscription.customer,
      description: "Charge for the remaining billing period"
    },
    function(err, charge) {
      
      if (err) return next(err);

      if (!charge) return next(new Error(BAD_CHARGE));

      next();
    }
  );
}

module.exports = CreateBlog;
