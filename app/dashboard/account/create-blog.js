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
    if (
      req.user.paypal &&
      parseInt(req.user.paypal.quantity) <= req.user.blogs.length
    ) {
      return next();
    }

    res.redirect(req.baseUrl);
  })

  .all(calculateFeeStripe, calculateFeePayPal)

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

    // Stripe customers
    chargeForRemainingStripe,
    updateSubscriptionStripe,

    // PayPal customers
    updateSubscriptionPayPal,
    chargeForRemainingPayPal,

    function (req, res) {
      console.log("REDIRECTING HERE INSTEAD...");
      res.redirect(req.baseUrl);
    }
  );

CreateBlog.route("/")

  .all(validateSubscription)

  .all(function (req, res, next) {
    // For institutional accounts, we need to allow them to create
    // at least one blog.
    if (
      !req.user.subscription.status &&
      !req.user.paypal.status &&
      req.user.blogs.length === 0
    ) {
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

function calculateFeeStripe (req, res, next) {
  // We dont need to do this for free users
  if (canSkip(req.user)) return next();

  // Does not use Stripe
  if (!req.user.subscription.status) return next();

  var subscription = req.user.subscription;
  var end = subscription.current_period_end;
  var start = subscription.current_period_start;
  var individual = subscription.plan.amount;

  // This happens when the latest subscription is not available from
  // Stripe. Basically the end date for the subscription is in the
  // past and the calculations below produce a negative amount to
  if (end * 1000 < Date.now()) {
    return next(new Error("Your subscription is out of date"));
  }

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

function calculateFeePayPal (req, res, next) {
  // We dont need to do this for free users
  if (canSkip(req.user)) return next();

  // Does not use PayPal
  if (!req.user.paypal.status) return next();

  // plan_identifier is either monthly_4 or yearly_44
  const plan_identifier = Object.keys(config.paypal.plans).find(
    identifier => config.paypal.plans[identifier] === req.user.paypal.plan_id
  );

  var amount = plan_identifier.includes("monthly") ? 400 : 4400;
  var quantity = parseInt(req.user.paypal.quantity);

  var startDateString = req.user.paypal.billing_info.last_payment.time;
  var endDateString = req.user.paypal.billing_info.next_billing_time;

  var start = new Date(startDateString).getTime();
  var end = new Date(endDateString).getTime();

  var remaining = end - Date.now();
  var length = end - start;
  var ratioToGo = remaining / length;
  var now = Math.round(ratioToGo * amount);
  var later = amount * quantity + amount;

  // This is used by the charge function so if you change it, also
  // change the charge function
  req.amount_due_now = now;

  res.locals.monthly = plan_identifier.includes("monthly");
  res.locals.interval = plan_identifier.includes("monthly") ? "month" : "year";
  res.locals.price = prettyPrice(amount);
  res.locals.now = prettyPrice(now);
  res.locals.later = prettyPrice(later);
  res.locals.individual = prettyPrice(amount);
  res.locals.first_blog =
    req.user.blogs.length === 0 && req.user.paypal.quantity === "1";

  next();
}

function validateSubscription (req, res, next) {
  if (canSkip(req.user)) return next();

  const activeStripeSubscription =
    !req.user.subscription ||
    !req.user.subscription.status ||
    req.user.subscription.status !== "active";

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
  if (!req.user.subscription.status) {
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

const fetch = require("node-fetch");

async function updateSubscriptionPayPal (req, res, next) {
  // We dont need to do this for free users
  if (!req.user.paypal.status) {
    return next();
  }

  // This is their first blog, so don't charge the user twice
  if (req.user.blogs.length === 0 && req.user.paypal.quantity === "1") {
    console.log("it the first blog");
    return next();
  }

  const new_quantity = (parseInt(req.user.paypal.quantity) + 1).toString();

  try {
    const response = await fetch(
      `${config.paypal.api_base}/v1/billing/subscriptions/${req.user.paypal.id}/revise`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(
            `${config.paypal.client_id}:${config.paypal.secret}`
          ).toString("base64")}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          plan_id: req.user.paypal.plan_id,
          quantity: new_quantity
        })
      }
    );

    const json = await response.json();

    if (
      json.quantity !== new_quantity ||
      json.plan_id !== req.user.paypal.plan_id
    ) {
      throw new Error("Could not update subscription");
    }
  } catch (e) {
    console.log("error", e);
    return next(e);
  }

  const updated_paypal = { ...req.user.paypal, quantity: new_quantity };

  User.set(req.user.uid, { paypal: updated_paypal }, function (err) {
    if (err) return next(err);

    Email.CREATED_BLOG(req.user.uid);
    next();
  });
}

async function chargeForRemainingPayPal (req, res, next) {
  // https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_patch
  // https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_capture
  if (!req.user.paypal.status) {
    return next();
  }

  const plan_identifier = Object.keys(config.paypal.plans).find(
    identifier => config.paypal.plans[identifier] === req.user.paypal.plan_id
  );

  const is_monthly = plan_identifier.includes("monthly");

  if (is_monthly) {
    return next();
  }

  // we want to patch the subscription to increase their balance due by req.amount_due_now
  // then we want to capture the payment

  const response = await fetch(
    `${config.paypal.api_base}/v1/billing/subscriptions/${req.user.paypal.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "PayPal-Auth-Assertion": "AUTH-ASSERTION",
        "Authorization": `Basic ${Buffer.from(
          `${config.paypal.client_id}:${config.paypal.secret}`
        ).toString("base64")}`
      },
      body: JSON.stringify([
        {
          op: "replace",
          path: "/billing_info/outstanding_balance",
          value: req.amount_due_now
        }
      ])
    }
  );

  const json = await response.json();

  console.log("UPDATE BALANCE JSON", json);

  const charge_response = await fetch(
    `${config.paypal.api_base}/v1/billing/subscriptions/${req.user.paypal.id}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PayPal-Auth-Assertion": "AUTH-ASSERTION",
        "Authorization": `Basic ${Buffer.from(
          `${config.paypal.client_id}:${config.paypal.secret}`
        ).toString("base64")}`
      },
      body: JSON.stringify({
        note: "Charging to create new site",
        capture_type: "OUTSTANDING_BALANCE",
        amount: { currency_code: "USD", value: req.amount_due_now }
      })
    }
  );

  const charge_json = await charge_response.json();

  console.log("CHARGE JSON", charge_json);

  return next();
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
