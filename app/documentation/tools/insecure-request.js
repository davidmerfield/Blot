const fetch = require("node-fetch");

const https = require("https");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

module.exports = async function (url) {
  await fetch(url, {
    method: "GET",
    agent: httpsAgent,
  });
};
