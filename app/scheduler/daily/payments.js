var config = require("config");
var stripe = require("stripe")(config.stripe.secret);
var helper = require("helper");

function main(callback) {
  var now = Date.now();
  var day = 1000 * 60 * 60 * 24;
  var yesterday = now - day;
  var last_month = now - day * 30;
  var last_week = now - day * 7;

  var charges = [];
  var options = { limit: 100, created: { gte: Math.floor(last_month / 1000) } };
  var revenue_in_last_30_days = 0;
  var revenue_in_last_7_days = 0;
  var revenue_in_last_24_hours = 0;

  stripe.charges.list(options, function then(err, res) {
    if (err) return callback(err);

    charges = charges.concat(res.data);

    if (res.has_more) {
      options.starting_after = res.data.slice(-1)[0].id;
      return stripe.charges.list(options, then);
    }

    charges.forEach(function(charge) {
      if (charge.refunded || charge.disputed) return;

      if (!charge.paid) return;

      revenue_in_last_30_days += charge.amount - charge.fee;

      if (charge.created * 1000 > last_week)
        revenue_in_last_7_days += charge.amount - charge.fee;

      if (charge.created * 1000 > yesterday)
        revenue_in_last_24_hours += charge.amount - charge.fee;
    });

    callback(null, {
      revenue_in_last_24_hours: helper.prettyPrice(revenue_in_last_24_hours),
      revenue_in_last_7_days: helper.prettyPrice(revenue_in_last_7_days),
      revenue_in_last_30_days: helper.prettyPrice(revenue_in_last_30_days)
    });
  });
}

module.exports = main;
if (require.main === module) require("./cli")(main);
