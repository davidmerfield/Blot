var pretty = require('helper').prettyPrice;

module.exports = function (req, res, next) {

  var subscription = req.user.subscription;

  if (!subscription || !subscription.status) {
    return next();
  }

  req.reduction = subscription.plan.amount;
  res.locals.next_bill = pretty((subscription.quantity - 1) * subscription.plan.amount);
  res.locals.reduction = pretty(subscription.plan.amount);

  return next();
};