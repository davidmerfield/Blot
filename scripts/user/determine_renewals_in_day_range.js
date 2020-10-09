var eachUser = require("../each/user");

// The number of days before a subscription is renewed or
// expired to send an email notification to the customer.
var DAYS_WARNING = 8;
var OLD_DAYS_WARNING = process.argv[2];

eachUser(function (user, next) {
	// Stripe uses a seconds timestamp vs. JavaScript's ms
	var notificationDate = new Date(user.subscription.current_period_end * 1000);
	var oldNotificationDate = new Date(
		user.subscription.current_period_end * 1000
	);

	// Subtract the number of days warning we'd like to give to user
	// Right now we tell them a week in advance of a renewal or expiry
	notificationDate.setDate(notificationDate.getDate() - DAYS_WARNING);
	oldNotificationDate.setDate(oldNotificationDate.getDate() - OLD_DAYS_WARNING);

	// console.log(
	// 	user.uid,
	// 	user.email,
	// 	"needs to be notified on",
	// 	notificationDate
	// );

	// When the server starts, we schedule a notification email for every user
	// If they should have been notified in the past, we stop now since we
	// don't want to email the user more than once.
	if (notificationDate.getTime() < Date.now()) {
		if (oldNotificationDate.getTime() > Date.now()) {
			console.log(
				"Bingo!",
				user.email,
				"still needs to be notified even",
				notificationDate
			);
		}
	}

	return next();
}, process.exit);
