var config = require('config');
var stripe = require('stripe')(config.stripe.secret);
var User = require('user');

var ERR = 'Could not change your subscription.';

module.exports = function (req, res, next) {

  var subscription = req.user.subscription;
  var quantity = req.user.blogs.length - 1;

  // The user does not have an active subscription
  // so proceed to the next middleware
  if (!subscription || !subscription.status || subscription.status !== 'active')
    return next();

  console.log('Setting subscription quantity to', quantity);

  stripe.customers.updateSubscription(
    subscription.customer,
    subscription.id,
    {quantity: quantity, prorate: false},
    function (err, subscription) {

      if (err) return next(err);

      if (!subscription) return next(new Error(ERR));

      User.set(req.user.uid, {subscription: subscription}, function(err){

        if (err) return next(err);

        next();
      });
    });
};