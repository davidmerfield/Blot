var User = require("models/user");
var async = require("async");
var prettyPrice = require("helper/prettyPrice");
var prettyNumber = require("helper/prettyNumber");

function removeStripeFee(amount) {
  return Math.floor(amount - (amount * 0.029 + 30));
}

function main(callback) {
  // Minus Stripe fees
  var annual_recurring_revenue_after_stripe = 0;
  var annual_recurring_revenue = 0;
  var revenue_billed_monthly = 0;
  var revenue_billed_monthly_after_stripe = 0;
  var total_active_blogs = 0;
  var total_subscriptions = 0;
  User.getAllIds(function (err, uids) {
    async.map(uids, User.getById, function (err, users) {
      users.forEach(function (user) {
        if (user.isDisabled) return;

        if (!user.subscription.status) return;

        if (user.subscription.status !== "active") return;

        if (user.subscription.cancel_at_period_end) return;

        if (user.subscription.current_period_end * 1000 < Date.now()) return;

        total_subscriptions++;
        total_active_blogs += user.subscription.quantity;

        if (user.subscription.plan.interval === "year") {
          annual_recurring_revenue +=
            user.subscription.quantity * user.subscription.plan.amount;
          annual_recurring_revenue_after_stripe += removeStripeFee(
            user.subscription.quantity * user.subscription.plan.amount
          );
        } else if (user.subscription.plan.interval === "month") {
          revenue_billed_monthly += removeStripeFee(
            user.subscription.quantity * user.subscription.plan.amount
          );
          annual_recurring_revenue_after_stripe +=
            removeStripeFee(
              user.subscription.quantity * user.subscription.plan.amount
            ) * 12;
          annual_recurring_revenue +=
            removeStripeFee(
              user.subscription.quantity * user.subscription.plan.amount
            ) * 12;
        }
      });

      callback(null, {
        revenue_billed_monthly: prettyPrice(
          Math.floor(revenue_billed_monthly / 100) * 100
        ),
        annual_recurring_revenue: prettyPrice(
          Math.floor(annual_recurring_revenue / 100) * 100
        ),
        monthly_recurring_revenue: prettyPrice(
          Math.floor(Math.floor(annual_recurring_revenue / 12) / 100) * 100
        ),
        total_subscriptions: total_subscriptions,
        total_active_blogs: prettyNumber(total_active_blogs),
      });
    });
  });
}

module.exports = main;
if (require.main === module) require("./cli")(main);
