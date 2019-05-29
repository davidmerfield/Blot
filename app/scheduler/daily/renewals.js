var User = require("user");
var async = require("async");
var helper = require("helper");
var moment = require("moment");

function removeStripeFee(amount) {
  return Math.floor(amount - (amount * 0.029 + 30));
}

function main(callback) {
  // Minus Stripe fees

  var renewals_today = { list: [], revenue: 0, total: 0 };
  var renewals_next_7_days = { list: [], revenue: 0, total: 0 };
  var renewals_next_30_days = { list: [], revenue: 0, total: 0 };

  var result = {
    renewals_today: renewals_today,
    renewals_next_30_days: renewals_next_30_days,
    renewals_next_7_days: renewals_next_7_days
  };

  var now = Date.now();
  var day = 1000 * 60 * 60 * 24;
  var tomorrow = now + day;
  var next_month = now + day * 30;
  var next_week = now + day * 7;

  User.getAllIds(function(err, uids) {
    async.map(uids, User.getById, function(err, users) {
      users.forEach(function(user) {
        if (!user.subscription.status) return;

        if (user.subscription.status !== "active") return;

        var next_payment = user.subscription.current_period_end * 1000;

        if (next_payment > next_month) return;

        if (next_payment < now) return;

        var revenue =
          Math.floor(
            removeStripeFee(
              user.subscription.quantity * user.subscription.plan.amount
            ) / 100
          ) * 100;

        var renewal = {
          email: user.email,
          revenue: helper.prettyPrice(revenue),
          next_payment: moment(next_payment).fromNow()
        };

        if (next_payment < tomorrow) {
          renewals_today.list.push(renewal);
          renewals_today.revenue += revenue;
          renewals_today.total += user.subscription.quantity;
        }

        if (next_payment < next_week) {
          renewals_next_7_days.list.push(renewal);
          renewals_next_7_days.revenue += revenue;
          renewals_next_7_days.total += user.subscription.quantity;
        }

        if (next_payment < next_month) {
          renewals_next_30_days.list.push(renewal);
          renewals_next_30_days.revenue += revenue;
          renewals_next_30_days.total += user.subscription.quantity;
        }
      });

      for (var i in result) {
        // Used for blog{{s}} to ensure correct grammar
        if (result[i].total === 1) {
          result[i].s = "";
        } else {
          result[i].s = "s";
        }

        result[i].total = helper.prettyNumber(result[i].total);
        result[i].revenue = helper.prettyPrice(result[i].revenue);
      }

      callback(null, result);
    });
  });
}

module.exports = main;

if (require.main === module) require("./cli")(main);
