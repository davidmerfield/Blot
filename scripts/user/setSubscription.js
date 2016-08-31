var from = process.argv[2];
var newSubscriptionID = process.argv[3];
var newCustomerID = process.argv[4];

var get = require('./blog/get');

var User = require('../app/models/user');
var Subscription = require('../app/models/subscription');

get(from, function(user){

  if (!user) throw 'No user';

  if (!newSubscriptionID) throw 'No Subscription id';
  if (!newCustomerID) throw 'No Customer id';

  var subscription = user.subscription;

  console.log(subscription);

  console.log('Customer ID', subscription.customer);

  console.log('Subscription was ', subscription.id);

  subscription.id = newSubscriptionID;
  subscription.customer = newCustomerID;
  subscription.status = 'active';

  console.log('Subscription is ', subscription.id);

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
