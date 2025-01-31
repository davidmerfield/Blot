
const https = require("https");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

module.exports = async function (url) {
  try {
    await fetch(url, {
      method: "GET",
      agent: httpsAgent,
    });
  } catch (e) {
    console.log(e);
  }
};
