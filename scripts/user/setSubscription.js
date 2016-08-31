var from = process.argv[2];
var newSubscriptionID = process.argv[3];
var newCustomerID = process.argv[4];
var config = require('config');
var stripe = require('stripe')(config.stripe.secret);

var get = require('../blog/get');

var User = require('../../app/models/user');
var Subscription = require('../../app/models/subscription');

get(from, function(user){

  if (!user) throw 'No user';
  if (!newSubscriptionID) throw 'No Subscription id';
  if (!newCustomerID) throw 'No Customer id';

  console.log('Subscription is ', user.subscription);

  stripe.customers.retrieveSubscription(newCustomerID, newSubscriptionID, function(err, subscription) {

    if (err) throw err;

    if (!subscription) throw 'No subscription found from Stripe';

    console.log(subscription);

    throw 'HERE';

    User.set(user.uid, {subscription: subscription}, function(err){

      if (err) throw err;

      Subscription.bind(subscription.customer, user.uid, function(err){

        if (err) throw err;

        process.exit();
      });
    });
  });
});
