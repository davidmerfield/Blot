var from = process.argv[2];
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);
var User = require("user");

User.getByEmail(from, function (err, user) {
	if (!user) throw "No user";

	stripe.customers.cancelSubscription(
		user.subscription.customer,
		user.subscription.id,
		{ at_period_end: false },
		function (err, subscription) {
			if (err) throw err;

			User.set(user.uid, { subscription: {} }, function (err) {
				if (err) throw err;

				process.exit();
			});
		}
	);
});
