var Express = require("express");
var CreateBlog = new Express.Router();
var Blog = require("blog");
var helper = require("helper");
var pretty = helper.prettyPrice;
var config = require("config");
var helper = require("helper");
var pretty = helper.prettyPrice;
var request = require("request");
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);
var User = require("user");
var Email = helper.email;
var BAD_CHARGE = "Could not charge your card.";
var ERR = "Could not change your subscription.";

CreateBlog.route("/pay")

  .all(validateSubscription)

  .all(function(req, res, next) {
    // Only allow users who have blogs for all they've paid
    // to see the pay page!
    if (req.user.subscription.quantity <= req.user.blogs.length) {
      return next();
    }

    res.redirect(req.baseUrl);
  })

  .all(calculateFee)

  .get(function(req, res) {
    res.locals.partials.yield = "account/create-blog-pay";

    res.render("partials/wrapper-setup", {
      title: "Create a blog",
      not_paid: true,
      breadcrumb: "Create a blog"
    });
  })

  .post(chargeForRemaining)

  .post(updateSubscription)

  .post(function(req, res) {
    res.message(req.baseUrl, "Your payment was received, thank you.");
  });

CreateBlog.route("/")

  .all(validateSubscription)

  .all(function(req, res, next) {
    if (
      req.user.subscription &&
      req.user.subscription.quantity !== null &&
      req.user.subscription.quantity !== undefined &&
      req.user.subscription.quantity > req.user.blogs.length
    ) {
      return next();
    }

    res.redirect(req.baseUrl + "/pay");
  })

  .get(function(req, res) {
    res.locals.partials.yield = "account/create-blog";
    res.locals.blog = {};
    res.render("partials/wrapper-setup", {
      title: "Create a blog",
      first_blog: req.user.blogs.length === 0,
      breadcrumb: "Create a blog"
    });
  })

  .post(saveBlog)

  .post(function(req, res) {
    res.message("/settings/client?setup=true", "Saved your title");
  })

  .post(function(err, req, res, next) {
    res.message(req.baseUrl + req.path, err);
  });

function calculateFee(req, res, next) {
  // We dont need to do this for free users
  if (canSkip(req.user)) return next();

  // This happens when the latest subscription is not available from
  // Stripe. Basically the end date for the subscription is in the
  // past and the calculations below produce a negative amount to
  if (end * 1000 < Date.now()) {
    return next(new Error("Your subscription is out of date"));
  }

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

  res.locals.monthly = subscription.plan.interval === "month";
  res.locals.interval = subscription.plan.interval;
  res.locals.price = pretty(subscription.plan.amount);
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
    res.message(
      "/account/subscription/create",
      new Error("You need an active subscription to create a new blog")
    );
  } else {
    next();
  }
}

var chars = "acemnorsuvwxz".split("");
var LEN = 8;
var PREFIX = "untitled";

function uid() {
  var res = "";
  while (res.length < LEN)
    res += chars[Math.floor(Math.random() * chars.length)];
  return PREFIX + "-" + res;
}

var chars = "abcdefghijklmnopqrstuvwxyz".split("");

function randomChars(len) {
  var res = "";

  while (res.length < len)
    res += chars[Math.floor(Math.random() * chars.length)];

  return res;
}

function handleFromTitle(title) {
  var handle = "";

  handle = title.toLowerCase().replace(/\W/g, "");

  return handle;
}

function saveBlog(req, res, next) {
  var title, handle;

  if (req.body.no_title) {
    title = "Untitled blog";
    handle = "untitled" + randomChars(5);
  } else if (!req.body.title) {
    return next(new Error("Please enter a title"));
  } else {
    title = req.body.title;
    handle = handleFromTitle(title);
  }

  var newBlog = {
    title: title,
    handle: handle,
    timeZone: req.body.timeZone
  };

  Blog.create(req.user.uid, newBlog, function onCreate(err, blog) {
    if (
      err &&
      err.handle &&
      err.handle.message === "That username was already in use."
    ) {
      newBlog.handle += randomChars(5);
      return Blog.create(req.user.uid, newBlog, onCreate);
    }

    if (err && err.handle) {
      return next(err.handle);
    }

    if (err) {
      return next(err);
    }

    // Begin SSL cert fetching process
    request(Blog.extend(blog).url, function() {});

    // Switch to the new blog
    req.session.blogID = blog.id;
    next();
  });
}

function canSkip(user) {
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

      User.set(req.user.uid, { subscription: subscription }, function(err) {
        if (err) return next(err);

        Email.CREATED_BLOG(req.user.uid);
        next();
      });
    }
  );
}

function chargeForRemaining(req, res, next) {
  // We dont need to do this for free users
  if (!req.user.subscription.status) {
    return next();
  }

  /// We don't need to do this for users with monthly billing
  if (req.user.subscription.plan.interval === "month") return next();

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
