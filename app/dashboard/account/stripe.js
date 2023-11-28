var config = require("config");
var stripe = require("stripe")(config.stripe.secret);
const prettyPrice = require("helper/prettyPrice");

module.exports = {
  load: function (req, res, next) {
    if (!req.user.subscription || !req.user.subscription.customer)
      return next();

    stripe.customers.retrieve(
      req.user.subscription.customer,
      function (err, customer) {
        // If we're offline or Stripe is down don't take the settings
        // page
        if (err && err.type === "StripeConnectionError") return next();

        if (err) return next(err);

        if (customer.balance !== 0 && Math.sign(customer.balance) === -1) {
          res.locals.balance = {
            credit: true,
            amount: prettyPrice(Math.abs(customer.balance))
          };
        } else if (
          customer.balance !== 0 &&
          Math.sign(customer.balance) === 1
        ) {
          res.locals.balance = {
            debit: true,
            amount: prettyPrice(Math.abs(customer.balance))
          };
        }

        next();
      }
    );
  }
};
