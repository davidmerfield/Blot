const each = require("../each/user");

each(
  function (user, next) {
    if (user.isDisabled) {
      console.log(user.email, "is disabled");
    }

    if (user.subscription && user.subscription.status === "unpaid") {
      console.log(
        user.email,
        "has an unpaid subscription with current period end:",
        new Date(user.subscription.current_period_end * 1000)
      );
      console.log(user.subscription);
    }
    next();
  },
  function (err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  }
);
