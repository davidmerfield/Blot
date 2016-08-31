var from = process.argv[2];
var subscriptionID = process.argv[3];

var get = require('./blog/get');

var User = require('../app/models/user');
var Subscription = require('../app/models/subscription');


get(from, function(user){

  if (!user) throw 'No user';

  if (!subscriptionID) throw 'No Subscription id';

  var subscription = user.subscription;

  console.log(subscription);

  console.log('Customer ID', subscription.customer);

  console.log('Subscription was ', subscription.id);

  subscription.id = subscriptionID;

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
