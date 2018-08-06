var Express = require("express");
var PaymentMethod = new Express.Router();

var config = require("config");
var email = require("email");
var stripe = require("stripe")(config.stripe.secret);
var User = require("user");

PaymentMethod.route("/")

  .all(function(req, res, next) {
    // User doesnt need to pay
    if (req.user.isFreeForLife) return res.redirect("/account");

    return next();
  })

  .get(function(req, res) {
    // If user is new or doesn't have a handle,
    // let them choose one
    res.render("account/payment-method", {
      stripe_key: config.stripe.key,
      breadcrumb: "Edit payment method",
      title: "Edit payment information"
    });
  })

  // Takes a stripe token generated
  // on the client and creates a charge
  .post(function(req, res, next) {
    var user = req.user;
    var uid = user.uid;

    var stripeToken = req.body.stripeToken;

    if (!stripeToken) return next(new Error('No Stripe token'));

    stripe.customers.updateSubscription(
      user.subscription.customer,
      user.subscription.id,
      { card: stripeToken, quantity: user.subscription.quantity },
      function(err, subscription) {

        if (err) return next(err);

        if (subscription) {

          User.set(uid, { subscription: subscription }, function(err) {
  
            if (err) return next(err);

            email.UPDATE_BILLING(uid);
            res.message(
              "/account",
              "Your payment information was updated successfully!"
            );
          });
        }
      }
    );
  });

module.exports = PaymentMethod;
