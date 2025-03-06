const clfdate = require("helper/clfdate");

const config = require("config");
const MAC_SERVER_ADDRESS = config.icloud.server_address;
const MACSERVER_AUTH = config.icloud.secret; // The Macserver Authorization secret from config

module.exports = async () => {
  console.log(clfdate(), "Connecting to mac server...");
  try {
    const res = await fetch(MAC_SERVER_ADDRESS + "/ping", {
      headers: { Authorization: MACSERVER_AUTH },
    });
    const text = await res.text();
    console.log(clfdate(), "Connected to mac server: ", text);

    // fetching stats

    const stats = await fetch(MAC_SERVER_ADDRESS + "/stats", {
      headers: { Authorization: MACSERVER_AUTH },
    });
    const statsText = await stats.text();
    console.log(clfdate(), "Mac server stats: ", statsText);
  } catch (error) {
    console.log(clfdate(), "Error connecting to mac server: ", error);
  }
};
