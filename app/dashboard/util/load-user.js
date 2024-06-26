var prettyPrice = require("helper/prettyPrice");
var User = require("models/user");

module.exports = function (req, res, next) {
  if (!req.session || !req.session.uid) return next();

  var uid = req.session.uid;

  User.getById(uid, function (err, user) {
    if (err) return next(err);

    if (!user) {
      req.user = null;
      req.session.uid = null;
      return next();
    }

    // You used to be able to disable your account
    // but this is no longer possible. Once all
    // users with isDisabled:true are removed you
    // can delete this check safely.
    if (user.isDisabled) {
      return res.redirect("/sites/disabled");
    }

    // Lets append the user and
    // set the partials to 'logged in mode'
    req.user = User.extend(user);
    res.locals.user = user;

    if (user.needsToPay && req.path !== "/sites/account/subscription") {
      return res.redirect("/sites/account/subscription");
    }

    if (user.subscription && user.subscription.plan) {
      res.locals.price = prettyPrice(user.subscription.plan.amount);
      res.locals.interval = user.subscription.plan.interval;
    }

    next();
  });
};
