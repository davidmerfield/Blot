const config = require("config");
const get = require("../get/user");
const fetch = require("node-fetch");

async function main (user, callback) {
  const response = await fetch(
    `${config.paypal.api_base}/v1/billing/subscriptions/${user.paypal.id}`,
    {
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": "en_US",
        "Authorization": `Basic ${Buffer.from(
          `${config.paypal.client_id}:${config.paypal.secret}`
        ).toString("base64")}`
      }
    }
  );

  const paypal = await response.json();

  callback(null, paypal);
}

module.exports = main;

if (require.main === module) {
  get(process.argv[2], function (err, user) {
    main(user, function (err, res) {
      if (err) throw err;
      console.log(res);
    });
  });
}
