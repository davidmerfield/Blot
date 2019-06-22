var User = require("user");
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);

function main(user, callback) {
  stripe.customers.retrieveSubscription(
    user.subscription.customer,
    user.subscription.id,
    function(err, subscription) {
      if (err) return callback(err);

      if (!subscription) return callback(new Error("No subscription"));

      User.set(user.uid, { subscription: subscription }, function(err) {
        if (err) return callback(err);

        console.log("Fetched latest subscription for user " + user.email);
        console.log(subscription);

        callback(null, subscription);
      });
    }
  );
}

if (require.main === module) {
  function done(err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  }

  if (process.argv[2]) {
    User.getByEmail(email, function(err, user) {
      if (err || !user) throw err || new Error("No user");
      main(user, done);
    });
  } else {
    yesno.ask(
      "Fetch latest subscription information from Stripe for all users? (y/N)",
      false,
      function(ok) {
        each(main, done);
      }
    );
  }
}

module.exports = main;
