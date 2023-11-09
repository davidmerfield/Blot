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
        "has an non-active subscription:",
        user.subscription
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
