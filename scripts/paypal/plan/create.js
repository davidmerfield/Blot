var request = require("request");
var config = require("config");

function main(product_id, callback) {
  require("../generate-access-token")(function(err, token) {
    request.post(
      {
        uri: "https://api.sandbox.paypal.com/v1/billing/plans",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": "en_US",
          Authorization: "Bearer " + token,

          // Optional and if passed, helps identify idempotent requests
          "PayPal-Request-Id": "BLOT-PLAN-" + Date.now()
        },
        body: JSON.stringify({
          product_id: product_id,
          name: "Blog",
          description: "A subscription to host a blog",
          quantity_supported: true,
          billing_cycles: [
            {
              frequency: {
                interval_unit: "MONTH",
                interval_count: 1
              },
              tenure_type: "REGULAR",
              sequence: 1,
              pricing_scheme: {
                fixed_price: {
                  value: "3",
                  currency_code: "USD"
                }
              }
            }
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            payment_failure_threshold: 3
          }
        })
      },
      function(err, res, data) {
        if (err) return callback(err);
        callback(null, JSON.parse(data));
      }
    );
  });
}

module.exports = main;

if (require.main === module)
  main(process.argv[2], function(err, res) {
    if (err) throw err;
    console.log(res);
  });
