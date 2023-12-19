const fetch = require("node-fetch");

module.exports = async host => {
  try {
    const res = await fetch("https://" + host + "/verify/domain-setup", {
      timeout: 3000
    });

    const body = await res.text();

    if (!body || body.indexOf(" ") > -1 || body.length > 100)
      throw new Error("Host " + host + " is not online");

    return true;
  } catch (e) {
    return false;
  }
};
