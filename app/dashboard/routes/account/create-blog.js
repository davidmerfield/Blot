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

CreateBlog.route("/pay")

  .all(validateSubscription)

  .all(function(req, res, next){

    if (req.user.subscription.quantity <= req.user.blogs.length) {
      return next();
    } 

    res.redirect(req.baseUrl);
  })

  .all(calculateFee)

  .get(function (req, res) {

    res.locals.partials.yield = "account/create-blog-pay";
    res.render("partials/wrapper-setup", {
      title: "Create a blog",
      not_paid: true,
      breadcrumb: "Create a blog"
    });
  })

  .post(chargeForRemaining, updateSubscription, function(req, res){
    res.message(req.baseUrl, 'Your payment was recieved and a receipt was sent to your email address');
  });

CreateBlog.route("/")

  .all(validateSubscription)

  .all(function(req, res, next){

    if (req.user.subscription && 
        req.user.subscription.quantity !== null &&
        req.user.subscription.quantity !== undefined && 
        req.user.subscription.quantity > req.user.blogs.length) {
      return next();
    } 

    res.redirect(req.baseUrl + '/pay');
  })

  .get(function(req, res) {
    res.locals.partials.yield = "account/create-blog";
    res.render("partials/wrapper-setup", {
      title: "Create a blog",
      not_created: true,
      breadcrumb: "Create a blog"
    });
  })

  .post(
    saveBlog,
    function(req, res) {
      res.redirect("/settings/client?setup=true");
    }
  )

function calculateFee(req, res, next) {

  // We dont need to do this for free users
  if (canSkip(req.user)) return next();

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

  if (canSkip(req.user)) return next();

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

var chars = 'acemnorsuvwxz'.split('');
var LEN = 8;
var PREFIX = 'untitled';

function uid () {
  var res = '';
  while (res.length < LEN) 
    res += chars[Math.floor(Math.random()*chars.length)];
  return PREFIX + '-' + res;
}

function saveBlog(req, res, next) {
  Blog.create(
    req.user.uid,
    {
      title: req.body.title,
      handle: req.body.title.toLowerCase().split('-').join(''),
      timeZone: req.body.timeZone
    },
    function(err, blog) {

      console.log(err);
      
      if (err) return next(err);

      // Switch to the new blog
      req.session.blogID = blog.id;

      next();
    }
  );
}

function canSkip (user) {
  return !user.subscription.status && user.blogs.length === 0;
}

function updateSubscription(req, res, next) {

  // We dont need to do this for free users
  if (canSkip(req.user)) {
    return next();
  }

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

  // We dont need to do this for free users
  if (!req.user.subscription.status) {
    return next();
  }

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
