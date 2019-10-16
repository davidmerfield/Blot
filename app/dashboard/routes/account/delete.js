var Express = require("express");
var Delete = new Express.Router();
var User = require("user");
var Email = require("helper").email;
var checkPassword = require("./util/checkPassword");
var logout = require("./util/logout");
var async = require("async");

var Blog = require("blog");
var pretty = require("helper").prettyPrice;

var User = require("user");
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);

Delete.route("/blog/:handle")

  // Verify the blog to be closed is owned
  // by the current user and load it into locals.
  // Work out how much we need to change the subscription
  // by after the blog has been deleted.
  .all(loadBlogToDelete, calculateSubscriptionChange)

  .get(function(req, res) {
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
    checkPassword,
    function(req, res, next) {
      Blog.remove(req.blogToDelete.id, next);
    },
    calculateSubscriptionChange,
    decreaseSubscription,
    function(req, res) {
      res.message("/account", "Deleted " + req.blogToDelete.title);
    }
  );

function loadBlogToDelete(req, res, next) {
  Blog.get({ handle: req.params.handle }, function(err, blog) {
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

function calculateSubscriptionChange(req, res, next) {
  var subscription = req.user.subscription;

  // The user does not have an active subscription
  // so proceed to the next middleware
  if (!subscription || !subscription.status || subscription.status !== "active")
    return next();

  var currentQuantity = req.user.subscription.quantity;
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

  res.locals.reduction = pretty(
    (currentQuantity - newQuantity) * req.user.subscription.plan.amount
  );
  req.newQuantity = newQuantity;

  return next();
}

Delete.route("/")

  .get(function(req, res) {
    res.render("account/delete", {
      title: "Delete your account",
      breadcrumb: "Delete"
    });
  })

  .post(
    checkPassword,
    deleteBlogs,
    deleteSubscription,
    deleteUser,
    emailUser,
    logout,
    function(req, res) {
      res.redirect("/account/deleted");
    }
  );

function emailUser(req, res, next) {
  Email.DELETED("", req.user, next);
}
function deleteBlogs(req, res, next) {
  async.each(req.user.blogs, Blog.remove, next);
}

function deleteUser(req, res, next) {
  User.remove(req.user.uid, next);
}

function decreaseSubscription(req, res, next) {
  var subscription = req.user.subscription;
  var quantity = req.newQuantity;

  if (!quantity || !subscription) return next();

  stripe.customers.updateSubscription(
    subscription.customer,
    subscription.id,
    { quantity: quantity, prorate: false },
    function(err, subscription) {
      if (err) return next(err);

      if (!subscription) return next(new Error("No subscription"));

      User.set(req.user.uid, { subscription: subscription }, function(err) {
        if (err) return next(err);

        Email.SUBSCRIPTION_DECREASE(req.user.uid);

        next();
      });
    }
  );
}

function deleteSubscription(req, res, next) {
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
