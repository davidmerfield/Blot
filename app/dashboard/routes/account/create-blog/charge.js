var helper = require('helper');
var pretty = helper.prettyPrice;

var config = require('config');
var stripe = require('stripe')(config.stripe.secret);
var User = require('user');

var calculate = require('./calculate');
var badSubscription = require('./badSubscription');

var BAD_CHARGE = 'Could not charge your card.';
var BAD_SUBSCRIPTION = 'You need an active subscription to create another blog.';
var ERR = 'Could not change your subscription.';

module.exports = function (req, res, next) {

  var user = req.user;

  // This is their first blog, so we've already
  // charged them, don't do it twice.
  if (req.session.newUser) return next();

  if (badSubscription(user.subscription)) {

    // Allow me to make free blogs...
    if (user.uid === config.admin.uid) return next();

    return next(new Error(BAD_SUBSCRIPTION));
  }

  var customerID = user.subscription.customer;
  var subscriptionID = user.subscription.id;

  var changes = {
    quantity: user.blogs.length + 1,
    prorate: false
  };

  console.log('Setting subscription quantity to', changes.quantity);

  stripe.customers.updateSubscription(
    customerID,
    subscriptionID,
    changes,
    function (err, subscription) {

      if (err) return next(err);

      if (!subscription) return next(new Error(ERR));

      console.log('User:', user.uid, 'Subscription changed to', changes.quantity, 'total blogs.');

      var now = calculate(subscription).now;

      stripe.charges.create({

        amount: now,
        currency: 'usd',
        customer: customerID,
        description: 'Charge for the remaining billing period'

      }, function (err, charge) {

        if (err) return next(err);

        if (!charge) return next(new Error(BAD_CHARGE));

        console.log('User:', user.uid, 'Charged successfully for', pretty(now), 'to create another blog.');

        User.set(user.uid, {subscription: subscription}, next);
      });
    }
  );
};