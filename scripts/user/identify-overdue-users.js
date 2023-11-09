const each = require("../each/user");

each(
  function (user, next) {
    if (
      user.subscription &&
      user.subscription.status &&
      user.subscription.status !== "active"
    ) {
      console.log(
        user.email,
        "has an non-active subscription:"
        // user.subscription
      );

      // convert   current_period_end: 1713619122 into a date
      console.log(
        "Subscription ends on",
        new Date(user.subscription.current_period_end * 1000)
      );
    }
    next();
  },
  function (err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  }
);
