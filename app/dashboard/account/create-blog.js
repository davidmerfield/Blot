var Express = require("express");
var CreateBlog = new Express.Router();
var Blog = require("models/blog");
var _ = require("lodash");
var prettyPrice = require("helper/prettyPrice");
var config = require("config");
var request = require("request");
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);
var User = require("models/user");
var Email = require("helper/email");
var BAD_CHARGE = "Could not charge your card.";
var ERR = "Could not change your subscription.";
var parse = require("dashboard/parse");
var updateSubscription = require("dashboard/paypal_webhook").updateSubscription;

CreateBlog.use(function (req, res, next) {
  res.locals.breadcrumbs.forEach(function (link) {
    if (link.label === "Your account") link.label = "Your blogs";
  });
  next();
});

CreateBlog.route("/paypal").get(async (req, res, next) => {
  // fetch the latest subscription from PayPal
  if (!req.user.paypal.id) return next();

  await updateSubscription(req.user.paypal.id);

  res.redirect("/dashboard/account/create-blog");
});

CreateBlog.route("/pay")

  .all(validateSubscription)

  .all(function (req, res, next) {
    // Only allow users who have blogs for all they've paid
    // to see the pay page!
    if (
      req.user.subscription.quantity <= req.user.blogs.length ||
      parseInt(req.user.paypal.quantity) <= req.user.blogs.length
    ) {
      return next();
    }

    res.redirect(req.baseUrl);
  })

  .all(calculateFee)

  .get(function (req, res) {
    res.locals.breadcrumbs = res.locals.breadcrumbs.slice(0, -1);
    res.locals.breadcrumbs[res.locals.breadcrumbs.length - 1].last = true;
    res.render("account/create-blog-pay", {
      title: "Create a blog",
      not_paid: true,
      breadcrumb: "Create blog",
      paypal_client_id: config.paypal.client_id,
      new_quantity: req.user.blogs.length + 1
    });
  })

  .post(parse, chargeForRemaining, updateSubscription, function (req, res) {
    res.redirect(req.baseUrl);
  });

CreateBlog.route("/")

  .all(validateSubscription)

  .all(function (req, res, next) {
    // For institutional accounts, we need to allow them to create
    // at least one blog.
    if (_.isEmpty(req.user.subscription) && req.user.blogs.length === 0) {
      return next();
    }

    // If the user pays for more blogs than they have
    // associated with their account, don't charge
    // them anything. This usually happens when they
    // delete their last blog.
    if (
      req.user.subscription &&
      req.user.subscription.quantity !== null &&
      req.user.subscription.quantity !== undefined &&
      req.user.subscription.quantity > req.user.blogs.length
    ) {
      return next();
    }

    if (req.user.paypal && req.user.paypal.quantity > req.user.blogs.length) {
      return next();
    }

    res.redirect(req.baseUrl + "/pay");
  })

  .get(function (req, res) {
    res.locals.blog = {};
    res.render("account/create-blog", {
      title: "Create a blog",
      first_blog: req.user.blogs.length === 0,
      breadcrumb: "Create a blog"
    });
  })

  .post(parse, saveBlog, function (req, res) {
    res.message(
      `/dashboard/${req.blog.handle}/client?setup=true`,
      "Saved your title"
    );
  })

  .post(function (err, req, res, next) {
    res.message(err);
  });

function calculateFee (req, res, next) {
  // We dont need to do this for free users
  if (canSkip(req.user)) return next();

  // Skip for PayPal users
  if (!req.user.subscription.status) return next();

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
  res.locals.price = prettyPrice(subscription.plan.amount);
  res.locals.now = prettyPrice(now);
  res.locals.later = prettyPrice(later);
  res.locals.individual = prettyPrice(individual);
  res.locals.first_blog =
    req.user.blogs.length === 0 && req.user.subscription.quantity === 1;

  next();
}

function validateSubscription (req, res, next) {
  if (canSkip(req.user)) return next();

  if (req.user.paypal && req.user.paypal.status === "ACTIVE") {
    return next();
  }

  if (req.user.subscription && req.user.subscription.status === "active") {
    return next();
  }

  res.message(
    "/dashboard/account/subscription/create",
    new Error("You need an active subscription to create a new blog")
  );
}

var chars = "abcdefghijklmnopqrstuvwxyz".split("");

function randomChars (len) {
  var res = "";

  while (res.length < len)
    res += chars[Math.floor(Math.random() * chars.length)];

  return res;
}

function handleFromTitle (title) {
  var handle = "";

  handle = title.toLowerCase().replace(/\W/g, "");

  if (handle.length < 4) {
    handle += randomChars(4 - handle.length);
  }

  return handle;
}

function saveBlog (req, res, next) {
  var title, handle;

  if (req.body.no_title) {
    title = "Untitled";
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

  Blog.create(req.user.uid, newBlog, function onCreate (err, blog) {
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
    request(Blog.extend(blog).url, function () {});
    req.blog = blog;
    next();
  });
}

function canSkip (user) {
  return (
    !user.subscription.status && !user.paypal.status && user.blogs.length === 0
  );
}

function updateSubscription (req, res, next) {
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
    function (err, subscription) {
      if (err) return next(err);

      if (!subscription) return next(new Error(ERR));

      User.set(req.user.uid, { subscription: subscription }, function (err) {
        if (err) return next(err);

        Email.CREATED_BLOG(req.user.uid);
        next();
      });
    }
  );
}

function chargeForRemaining (req, res, next) {
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

  // Stripe won't charge less than $0.50, we'll just take the hit
  if (req.amount_due_now <= 50) return next();

  stripe.charges.create(
    {
      amount: req.amount_due_now,
      currency: "usd",
      customer: req.user.subscription.customer,
      description: "Charge for the remaining billing period"
    },
    function (err, charge) {
      if (err) return next(err);

      if (!charge) return next(new Error(BAD_CHARGE));

      next();
    }
  );
}

module.exports = CreateBlog;
