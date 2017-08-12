// Error Messages
var BAD_CHARGE = 'We were unable to charge your card. Please fill out the form and try again, it should work.';
var NO_EMAIL = 'Please enter an email address';
var IN_USE = 'That email address is already used by another Blot account.';
var DECLINED = 'Your card was declined, please try again.';
var NO_CUSTOMER = 'No Customer';

var Express = require('express');
var config = require('config');
var stripe = require('stripe')(config.stripe.secret);
var parse = require('body-parser').urlencoded({extended:false});
var User = require('user');

var signup = Express.Router();
var paymentForm = signup.route('/');
var passwordForm = signup.route('/create-account');

paymentForm.get(function(req, res){

  if (req.session && req.session.email && req.session.subscription)
    return res.redirect(req.baseUrl + passwordForm.path);

  res.locals.title = 'Sign up for Blot and start your blog';
  res.locals.error = req.query.error;
  res.locals.stripe_key = config.stripe.key;

  res.render('sign-up-payment');
});

paymentForm.post(parse, function(req, res, next){

  // Card is a stripe token generated on the client
  var card = req.body && req.body.stripeToken;
  var email = req.body && req.body.email;

  if (!email)
    return next(new Error(NO_EMAIL));

  if (!card)
    return next(new Error(BAD_CHARGE));

  User.getByEmail(email, function(err, existingUser){

    if (err) return next(err);

    if (existingUser) return next(new Error(IN_USE));

    var info = {
      card: card,
      email: email,
      plan: 'yearly_20',
      description: 'Blot subscription'
    };

    stripe.customers.create(info, function (err, customer) {

      if (err && err.type === 'StripeCardError') {
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

      console.log('Customer: ' + customer.subscription.customer + ' charged successfuly for ' + email);
      res.redirect(req.baseUrl + passwordForm.path);
    });
  });
});

passwordForm.all(function(req, res, next) {

  if (!req.session || !req.session.email || !req.session.subscription)
    return res.redirect(req.baseUrl + paymentForm.path);

  next();
});

passwordForm.get(function(req, res){

  res.locals.email = req.session.email;
  res.locals.subscription = !!req.session.subscription;
  res.locals.error = req.query.error;
  res.locals.change_email = req.query.change_email;

  res.render('sign-up-password');
});

passwordForm.post(parse, function(req, res, next){

  var subscription = req.session.subscription;
  var email = req.body.email;
  var password = req.body.password;

  if (!email) return next(new Error('Please choose an email address'));

  if (!password) return next(new Error('Please choose a password'));

  User.hashPassword(password, function(err, passwordHash) {

    if (err) return next(err);

    User.create(email, passwordHash, subscription, function(err, user){

      if (err) return next(err);

      delete req.session.email;
      delete req.session.subscription;

      req.session.uid = user.uid;

      res.redirect('/account/create-blog');
    });
  });
});

// This is error handling middleware
// specific to the sign up page
signup.use(function (err, req, res, next){

  if (err && err.message) return res.redirect(req.baseUrl + req.path + '?error=' + encodeURIComponent(err.message));

  next();
});

module.exports = signup;