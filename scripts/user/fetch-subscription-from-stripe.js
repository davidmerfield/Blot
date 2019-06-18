var User = require("user");
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);

function main(email, callback) {
  User.getByEmail(email, function(err, user) {
    if (err) return callback(err);

    stripe.customers.retrieveSubscription(
      user.subscription.customer,
      user.subscription.id,
      function(err, subscription) {
        if (err) return callback(err);

        if (!subscription) return callback(new Error("No subscription"));

        User.set(user.uid, { subscription: subscription }, function(err) {
          if (err) return callback(err);

          callback(null, subscription);
        });
      }
    );
  });
}

if (require.main === module) {
  main(process.argv[2], function(err, subscription) {
    if (err) throw err;
    console.log("Fetched latest subscription for user " + process.argv[2]);
    console.log(subscription);
    process.exit();
  });
}

module.exports = main;