var Express = require("express");
var CreateBlog = new Express.Router();
var Blog = require("models/blog");
var _ = require("lodash");
var prettyPrice = require("helper/prettyPrice");
var config = require("config");
var request = require("request");
var stripe = require("stripe")(config.stripe.secret);
var User = require("models/user");
var Email = require("helper/email");
var BAD_CHARGE = "Could not charge your card.";
var ERR = "Could not change your subscription.";
var parse = require("dashboard/parse");

CreateBlog.use(function (req, res, next) {
  res.locals.breadcrumbs.forEach(function (link) {
    if (link.label === "Your account") link.label = "Your blogs";
  });
  next();
});

CreateBlog.route("/pay")

  .all(validateSubscription)

  .all(function (req, res, next) {
    // Only allow users who have blogs for all they've paid
    // to see the pay page!

    // Stripe
    if (
      req.user.subscription &&
      req.user.subscription.quantity <= req.user.blogs.length
    ) {
      return next();
    }

    // PayPal
    if (req.user.paypal && req.user.paypal.quantity <= req.user.blogs.length) {
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
      breadcrumb: "Create blog"
    });
  })

  .post(
    parse,
    chargeForRemainingStripe,
    updateSubscriptionStripe,
    updateSubscriptionPayPal,
    function (req, res) {
      res.redirect(req.baseUrl);
    }
  );

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
  var subscription = req.user.subscription;

  if (canSkip(req.user)) return next();

  const activeStripeSubscription =
    !subscription || !subscription.status || subscription.status !== "active";

  const activePayPalSubscription =
    !req.user.paypal ||
    !req.user.paypal.status ||
    req.user.paypal.status !== "ACTIVE";

  if (!activeStripeSubscription && !activePayPalSubscription) {
    res.message(
      "/dashboard/account/subscription/create",
      new Error("You need an active subscription to create a new blog")
    );
  } else {
    next();
  }
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

function updateSubscriptionStripe (req, res, next) {
  // We dont need to do this for free users
  if (canSkip(req.user)) {
    return next();
  }

  // This user doesnt use Stripe
  if (!req.user.subscription.customer) {
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

const { paypal } = require("config");
const fetch = require("node-fetch");

function updateSubscriptionPayPal (req, res, next) {
  /*
  curl -v -X POST https://api-m.sandbox.paypal.com/v1/subscriptions/I-BW452GLLEP1G/revise 
-H "PayPal-Auth-Assertion: AUTH-ASSERTION" / 
-H "Content-Type: application/json" \
-H "Authorization: Basic ACCESS-TOKEN" \
-d '{
  "plan_id": "P-5ML4271244454362WXNWU5NQ",
  "quantity": "10"
}'
  */

  // We dont need to do this for free users
  if (!req.user.paypal.status) {
    return next();
  }

  /// We don't need to do this for users with monthly billing
  if (req.user.paypal.plan.interval === "month") return next();

  // This is their first blog, so don't charge the user twice
  if (req.user.blogs.length === 0 && req.user.paypal.quantity === 1) {
    return next();
  }

  // Issue the request to PayPal
  fetch(
    `${paypal.api_base}/v1/billing/subscriptions/${req.user.paypal.id}/revise`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PayPal-Auth-Assertion": paypal.auth_assertion,
        "Authorization": `Basic ${Buffer.from(
          `${paypal.client_id}:${paypal.secret}`
        ).toString("base64")}`
      },
      body: JSON.stringify({
        plan_id: paypal.plan_id,
        quantity: req.user.blogs.length + 1
      })
    }
  )
    .then(res => res.json())
    .then(json => {
      if (json.error) {
        return next(new Error(json.error.message));
      }

      User.set(req.user.uid, { paypal: json }, function (err) {
        if (err) return next(err);

        Email.CREATED_BLOG(req.user.uid);
        next();
      });
    })
    .catch(next);
}

function chargeForRemainingStripe (req, res, next) {
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
