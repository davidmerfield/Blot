const each = require("../each/user");
const User = require("models/user");

each(
  function (user, next) {
    if (user.paypal !== undefined) return next();

    user.paypal = {};

    User.set(user.uid, { paypal: {} }, function (err) {
      if (err) throw err;
      next();
    });
  },
  function (err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  }
);
