const each = require("../each/user");

each(
  function (user, next) {
    if (user.subscription && user.subscription.status === "unpaid") {
      console.log(user.email);
    }
  },
  function (err) {
    if (err) throw err;
    process.exit();
  }
);
