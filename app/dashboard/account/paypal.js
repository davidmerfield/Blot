module.exports = {
  load: function (req, res, next) {
    if (!req.user.paypal || !req.user.paypal.status) return next();

    if (req.user.paypal.billing_info.outstanding_balance.value !== "0.0") {
      res.locals.balance = {
        debit: true,
        amount:
          req.user.paypal.billing_info.outstanding_balance.value +
          " " +
          req.user.paypal.billing_info.outstanding_balance.currency_code
      };
    }

    next();
  }
};
