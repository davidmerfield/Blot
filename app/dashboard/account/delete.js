var Express = require("express");
var Delete = new Express.Router();
var User = require("models/user");
var Email = require("helper/email");
var checkPassword = require("./util/checkPassword");
var logout = require("./util/logout");
var async = require("async");

var Blog = require("models/blog");
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);

const parse = require("dashboard/parse");

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

async function deleteSubscription (req, res, next) {
  if (req.user.paypal.status) {
    try {
      const response = await fetch(
        `${config.paypal.api_base}/v1/billing/subscriptions/${req.user.paypal.id}/cancel`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${Buffer.from(
              `${config.paypal.client_id}:${config.paypal.secret}`
            ).toString("base64")}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reason: "Customer deleted account"
          })
        }
      );

      // if successful, we should get a 204 response
      // otherwise throw an error
      if (response.status !== 204) {
        throw new Error("PayPal subscription cancellation failed");
      }
      next();
    } catch (e) {
      return next(e);
    }
  } else if (req.user.subscription.customer) {
    stripe.customers.del(req.user.subscription.customer, next);
  } else {
    next();
  }
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
