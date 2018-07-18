var config = require("config");
var User = require("user");
var stripe = require("stripe")(config.stripe.secret);
var email = require("email");

module.exports = function(server) {
  var ROUTE = "/account/restart";
  var TITLE = "Restart your subscription";

  var ERROR = "We were unabled to restart your subscription, please try again.";
  var SUCCESS = "Your subscription was restarted successfully!";

  server

    .route(ROUTE)

    .all(function(req, res, next) {
      // Make sure the user has a subscription
      // otherwise they have nothing to cancel
      if (!req.user.isSubscribed) return next();

      return res.redirect("/account");
    })

    .get(function(req, res) {
      res.title(TITLE);
      res.locals.subpage_title = TITLE;
      res.locals.subpage_slug = "cancel";

      res.renderAccount("restart");
    })

    .post(function(req, res, next) {
      var user = req.user;
      var uid = user.uid;

      stripe.customers.updateSubscription(
        user.subscription.customer,
        user.subscription.id,
        {  },
        function(err, subscription) {
          if (err) {
            res.message({ error: err.message || ERROR, url: ROUTE });
            return res.redirect(req.path);
          }

          if (!subscription) {
            res.message({ error: ERROR, url: ROUTE });
            return res.redirect(req.path);
          }

          User.set(uid, { subscription: subscription }, function(err) {
            if (err) return next(err);

            email.RESTART(uid);
            res.message({
              success: SUCCESS,
              url: "/account"
            });
            res.redirect("/account");
          });
        }
      );
    });
};
