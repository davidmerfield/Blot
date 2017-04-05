var helper = require('helper');
var ensure = helper.ensure;

module.exports = function (subscription) {

  ensure(subscription, 'object');

  if (!subscription || !subscription.status || subscription.status !== 'active') {
    return {
      now: 0,
      later: 0,
      individual: 0
    };
  }

  var end = subscription.current_period_end;
  var start = subscription.current_period_start;
  var individual = subscription.plan.amount;

  var remaining = (end * 1000) - Date.now();
  var length = (end - start) * 1000;

  var ratioToGo = remaining/length;

  var now = Math.round(ratioToGo * individual);
  var later = (subscription.plan.amount * subscription.quantity) + subscription.plan.amount;

  return {
    now: now,
    later: later,
    individual: individual
  };
};