const each = require("../each/user");

each(
  function (user, next) {
    if (
      user.subscription &&
      user.subscription.status &&
      user.subscription.status === "unpaid"
    ) {
      console.log(user.email, "has an unpaid subscription");
    }
    next();
  },
  function (err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  }
);
