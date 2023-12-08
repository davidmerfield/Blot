const get = require("../get/user");
const config = require("config");
const fetch = require("node-fetch");

const main = async user => {
  const response = await fetch(
    `${config.paypal.api_base}/v1/billing/subscriptions/${user.paypal.id}/revise`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(
          `${config.paypal.client_id}:${config.paypal.secret}`
        ).toString("base64")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quantity: (user.blogs.length + 1).toString(),
        reason: "New blog"
      })
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const json = await response.json();

  console.log(json);
};

if (require.main === module) {
  get(process.argv[2], function (err, user) {
    main(user)
      .catch(err => {
        console.error(err);
        process.exit(1);
      })
      .then(() => {
        process.exit(0);
      });
  });
}
