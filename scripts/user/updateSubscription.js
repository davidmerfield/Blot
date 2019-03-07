var User = require('user');
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);

User.getByEmail(process.argv[2], function(err, user){

  if (err) throw err;

  console.log(user);

  stripe.customers.retrieveSubscription(
      user.subscription.customer,
      user.subscription.id,
      function(err, subscription) {
        if (err) throw err;

        if (!subscription) throw new Error("No subscription");

        User.set(user.uid, { subscription: subscription }, function(err) {
          
          console.log('Done!');
        });
      }
    );
});
