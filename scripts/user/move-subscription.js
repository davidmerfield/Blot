var from = process.argv[2];
var to = process.argv[3];

var get = require('./blog/get');

var User = require('../app/models/user');
var Subscription = require('../app/models/subscription');

console.log(from);
console.log(to);

get(from, function(oldUser){

  get(to, function(newUser){

    var customerID = oldUser.subscription.customer;

    var newSubscription = {subscription: oldUser.subscription};
    var oldSubscription = {
      subscription: newUser.subscription,
      isDisabled: true
    };

    console.log('Customer ID', customerID);

    console.log('Subscription for ', to);
    console.log(newSubscription);

    console.log('Subscription for ', from);
    console.log(oldSubscription);


    User.set(newUser.uid, newSubscription, function(err){

      if (err) throw err;

      User.set(oldUser.uid, oldSubscription, function(err){

        if (err) throw err;

        Subscription.bind(customerID, newUser.uid, function(err){

          if (err) throw err;

          process.exit();
        });
      });
    });
  });
});
