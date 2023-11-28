var Express = require("express");
var Delete = new Express.Router();
var User = require("models/user");
var Email = require("helper/email");
var checkPassword = require("./util/checkPassword");
var logout = require("./util/logout");
var async = require("async");
var fetch = require("node-fetch");
var Blog = require("models/blog");
var pretty = require("helper/prettyPrice");

var User = require("models/user");
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);

const parse = require("dashboard/parse");

Delete.route("/blog/:handle")

  // Verify the blog to be closed is owned
  // by the current user and load it into locals.
  // Work out how much we need to change the subscription
  // by after the blog has been deleted.
  .all(loadBlogToDelete, calculateSubscriptionChange)

  .get(function (req, res) {
    res.locals.title = "Delete " + req.blogToDelete.pretty.label;
    res.locals.breadcrumb = "Delete  " + req.blogToDelete.pretty.label;
    res.render("account/delete-blog", { host: process.env.BLOT_HOST });
  })

  // Save any changes to the user's subscription
  // then remove the blogID from the list of blogs
  // owned by the user.
  // Finally delete contents of the blog's folder on s3
  // which contains cached images/avatars. Also delete
  // the contents blog's folder on the server.
  // Delete the credentials used to sync the blog's folder
  .post(
    parse,
    checkPassword,
    function (req, res, next) {
      Blog.remove(req.blogToDelete.id, next);
    },
    calculateSubscriptionChange,
    decreaseSubscriptionStripe,
    decreaseSubscriptionPayPal,
    function (req, res) {
      res.message(req.baseUrl, "Deleted " + req.blogToDelete.title);
    }
  );

function loadBlogToDelete (req, res, next) {
  Blog.get({ handle: req.params.handle }, function (err, blog) {
    if (err) {
      return next(err);
    }

    if (!blog || blog.owner !== req.user.uid) {
      return next(new Error("There is no blog to delete"));
    }

    req.blogToDelete = Blog.extend(blog);
    res.locals.blogToDelete = blog;

    next();
  });
}

function calculateSubscriptionChange (req, res, next) {
  // The user does not have a subscription
  // so proceed to the next middleware
  if (!req.user.subscription.status && !req.user.paypal.status) {
    return next();
  }

  if (
    req.user.subscription.status &&
    req.user.subscription.status !== "active"
  ) {
    return next();
  }

  if (req.user.paypal.status && req.user.paypal.status !== "ACTIVE") {
    return next();
  }

  var currentQuantity = req.user.subscription.status
    ? req.user.subscription.quantity
    : parseInt(req.user.paypal.quantity);

  var amount;

  if (req.user.subscription.status) {
    amount = req.user.subscription.plan.amount;
  } else {
    const plan_identifier = Object.keys(config.paypal.plans).find(
      identifier => config.paypal.plans[identifier] === req.user.paypal.plan_id
    );

    amount = plan_identifier.includes("monthly") ? 400 : 4400;
  }

  var newQuantity = req.user.blogs.length - 1;

  // Quantity cannot go below 1
  // You must pay for at least one blog to keep an account open
  // We only decrease the quantity on the Stripe plan if you are
  // paying for all of your blogs.
  if (newQuantity < 1) newQuantity = 1;

  // You can't increase your bill by deleting a blog
  // Some early users have free blogs for various
  // reasons. Handle this case here.
  if (newQuantity >= currentQuantity) return next();

  res.locals.reduction = pretty((currentQuantity - newQuantity) * amount);
  req.newQuantity = newQuantity;

  return next();
}

Delete.route("/")

  .get(function (req, res) {
    res.render("account/delete", {
      title: "Delete your account",
      breadcrumb: "Delete"
    });
  })

  .post(
    parse,
    checkPassword,
    deleteBlogs,
    deleteSubscription,
    deleteUser,
    emailUser,
    logout,
    function (req, res) {
      res.redirect("/dashboard/deleted");
    }
  );

function emailUser (req, res, next) {
  Email.DELETED("", req.user, next);
}
function deleteBlogs (req, res, next) {
  async.each(req.user.blogs, Blog.remove, next);
}

function deleteUser (req, res, next) {
  User.remove(req.user.uid, next);
}

function decreaseSubscriptionStripe (req, res, next) {
  var quantity = req.newQuantity;

  if (!quantity || !req.user.subscription.status) return next();

  stripe.customers.updateSubscription(
    subscription.customer,
    subscription.id,
    { quantity, prorate: false },
    function (err, subscription) {
      if (err) return next(err);

      if (!subscription) return next(new Error("No subscription"));

      User.set(req.user.uid, { subscription }, function (err) {
        if (err) return next(err);

        Email.SUBSCRIPTION_DECREASE(req.user.uid);
        next();
      });
    }
  );
}

async function decreaseSubscriptionPayPal (req, res, next) {
  var new_quantity = req.newQuantity;

  if (!new_quantity || !req.user.paypal.status) return next();

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

  const new_paypal = {
    ...req.user.paypal,
    quantity: new_quantity
  };

  User.set(req.user.uid, { paypal: new_paypal }, function (err) {
    if (err) return next(err);

    Email.SUBSCRIPTION_DECREASE(req.user.uid);

    next();
  });
}

function deleteSubscription (req, res, next) {
  if (!req.user.subscription || !req.user.subscription.customer) {
    return next();
  }

  stripe.customers.del(req.user.subscription.customer, next);
}

// We expose these methods for our scripts
// Hopefully this does not clobber anything in
// the exposed Express application?

if (Delete.exports !== undefined)
  throw new Error(
    "Delete.exports is defined (typeof=" +
      typeof Delete.exports +
      ") Would clobber Delete.exports"
  );

Delete.exports = {
  blogs: deleteBlogs,
  user: deleteUser,
  subscription: deleteSubscription
};

module.exports = Delete;
