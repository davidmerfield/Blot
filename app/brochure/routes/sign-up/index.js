// Error Messages
var BAD_CHARGE =
  "We were unable to charge your card. Please fill out the form and try again, it should work.";
var NO_EMAIL = "Please enter an email address";
var IN_USE = "That email address is already used by another Blot account.";
var DECLINED = "Your card was declined, please try again.";
var NO_CUSTOMER = "No Customer";

var Express = require("express");
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);
var parse = require("body-parser").urlencoded({ extended: false });
var User = require("user");
var Email = require("helper").email;
var signup = Express.Router();

signup.use(function(req, res, next) {
  if (req.user) return res.redirect("/");

  res.header("Cache-Control", "no-cache");
  res.locals.layout = "partials/layout-form";

  return next();
});

var paymentForm = signup.route("/");
var passwordForm = signup.route("/create-account");

passwordForm.all(function(req, res, next) {
  if (req.user) return res.redirect("/");

  return next();
});

if (config.maintenance) {
  paymentForm.use("/sign-up", function(req, res) {
    res.redirect("/maintenance");
  });
}

// For users who paid by PayPal I have a tool to skip the Stripe
// form using an access token I generate myself
paymentForm.get(function(req, res, next) {
  // Just a regular old request, carry on.
  if (!req.query.already_paid) return next();

  // First we make sure that the access token passed is valid.
  User.checkAccessToken(req.query.already_paid, function(err, email) {
    if (err || !email) {
      err = new Error(
        "The link you just used is not valid, please ask David to send you another one."
      );
      return next(err);
    }

    req.session.email = email;
    req.session.subscription = {};
    req.session.already_paid = true;

    next();
  });
});

paymentForm.get(function(req, res) {
  if (req.session && req.session.email && req.session.subscription)
    return res.redirect(req.baseUrl + passwordForm.path);

  res.locals.title = "Sign up";
  res.locals.menu = { "sign-up": "selected" };
  res.locals.error = req.query.error;
  res.locals.stripe_key = config.stripe.key;
  res.render("sign-up");
});

paymentForm.post(parse, function(req, res, next) {
  // Card is a stripe token generated on the client
  var card = req.body && req.body.stripeToken;
  var email = req.body && req.body.email;

  // Normalize the email here before storing it
  // in the browser's session
  email = email.trim().toLowerCase();

  if (!email) return next(new Error(NO_EMAIL));

  if (!card) return next(new Error(BAD_CHARGE));

  var info = {
    card: card,
    email: email,
    plan: config.stripe.plan,
    description: "Blot subscription"
  };

  User.getByEmail(email, function(err, existingUser) {
    if (err) return next(err);

    if (existingUser) return next(new Error(IN_USE));

    stripe.customers.create(info, function(err, customer) {
      if (err && err.type === "StripeCardError") {
        return next(new Error(DECLINED));
      }

      if (err) {
        return next(new Error(BAD_CHARGE));
      }

      if (!customer) {
        return next(new Error(NO_CUSTOMER));
      }

      // Store the user's email and charge ID
      // so that when the user returns from
      // Dropbox we know they have a blot account
      req.session.email = email;
      req.session.subscription = customer.subscription;

      console.log(
        "Customer: " +
          customer.subscription.customer +
          " charged successfuly for " +
          email
      );
      res.redirect(req.baseUrl + passwordForm.path);
    });
  });
});

passwordForm.all(function(req, res, next) {
  if (!req.session || !req.session.email || !req.session.subscription)
    return res.redirect(req.baseUrl + paymentForm.path);

  next();
});

passwordForm.get(function(req, res) {
  res.locals.title = "Sign up";
  res.locals.email = req.session.email;
  res.locals.subscription = !!req.session.subscription;
  res.locals.error = req.query.error;
  res.locals.errormessage = req.query.error;
  res.locals.change_email = req.query.change_email;
  res.locals.already_paid = req.session.already_paid;

  res.render("sign-up/password");
});

passwordForm.post(parse, function(req, res, next) {
  var subscription = req.session.subscription;
  var email = req.body.email;
  var password = req.body.password;

  if (!email) return next(new Error("Please choose an email address"));

  if (!password) return next(new Error("Please choose a password"));

  User.hashPassword(password, function(err, passwordHash) {
    if (err) return next(err);

    User.create(email, passwordHash, subscription, function(err, user) {
      if (err) return next(err);

      delete req.session.email;
      delete req.session.subscription;

      req.session.uid = user.uid;
      Email.CREATED_BLOG(user.uid);
      res.redirect("/account/create-blog");
    });
  });
});

// This is error handling middleware
// specific to the sign up page
signup.use(function(err, req, res, next) {
  if (err && err.message)
    return res.redirect(
      req.baseUrl + req.path + "?error=" + encodeURIComponent(err.message)
    );

  next();
});

module.exports = signup;
