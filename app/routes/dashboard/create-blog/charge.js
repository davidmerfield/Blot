var helper = require('../../../helper');
var ensure = helper.ensure;
var pretty = helper.prettyPrice;

var config = require('../../../../config');
var stripe = require('stripe')(config.stripe.secret);
var User = require('../../../models/user');

var calculate = require('./calculate');
var badSubscription = require('./badSubscription');

module.exports = function (user, callback) {

  ensure(user, 'object')
    .and(callback, 'function');

  // This is their first blog, so no charge
  if (!user.blogs.length) return callback();

  if (badSubscription(user.subscription)) {

    // Allow me to make free blogs...
    if (user.uid === config.admin.uid)
      return callback();

    return callback('You need an active subscription to create another blog.');
  }

  var customerID = user.subscription.customer;
  var subscriptionID = user.subscription.id;

  var changes = {
    quantity: user.blogs.length + 1,
    prorate: false
  };

  stripe.customers.updateSubscription(
    customerID,
    subscriptionID,
    changes,
    function (err, subscription) {

      if (err || !subscription)
        return callback(err || 'Could not change your subscription.');

      console.log('User:', user.uid, 'Subscription changed to', changes.quantity, 'total blogs.');

      var now = calculate(subscription).now;

      stripe.charges.create({

        amount: now,
        currency: 'usd',
        customer: customerID,
        description: 'Charge for the remaining billing period'

      }, function (err, charge) {

        if (err || !charge) return callback(err || 'Could not charge your card.');

        console.log('User:', user.uid, 'Charged successfully for', pretty(now), 'to create another blog.');

        User.set(user.uid, {subscription: subscription}, callback);
      });
    }
  );
};