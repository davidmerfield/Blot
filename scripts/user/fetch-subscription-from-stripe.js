var User = require("user");
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);
var yesno = require("yesno");
var each = require("../each/user");
function main(user, callback) {
  stripe.customers.retrieveSubscription(
    user.subscription.customer,
    user.subscription.id,
    function(err, subscription) {
      if (err || !subscription)
        return callback(err || new Error("No subscription"));

      User.set(user.uid, { subscription: subscription }, function(err) {
        if (err) return callback(err);

        console.log(
          "User:",
          user.uid,
          user.email,
          user.subscription.customer,
          "updated subscription",
          user.subscription.id
        );

        callback(null, subscription);
      });
    }
  );
}

function done(err) {
  if (err) throw err;
  console.log("Done!");
  process.exit();
}

if (require.main === module) {
  if (process.argv[2]) {
    User.getByEmail(process.argv[2], function(err, user) {
      if (err || !user) throw err || new Error("No user");
      main(user, done);
    });
  } else {
    yesno.ask(
      "Fetch latest subscription information from Stripe for all users? (y/N)",
      false,
      function(ok) {
        if (!ok) return process.exit();
        each(main, done);
      }
    );
  }
}

module.exports = main;
