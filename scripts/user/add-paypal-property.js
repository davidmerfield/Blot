const each = require("../each/user");
const User = require("models/user");

each(
  function (user, next) {
    if (user.paypal !== undefined) return next();

    user.paypal = {};

    console.log("Adding paypal property to", user.email);
    User.set(user.uid, { paypal: {} }, function (err) {
      if (err) throw err;
      console.log("Added paypal property to", user.email);
      next();
    });
  },
  function (err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  }
);
