const clfdate = require("helper/clfdate");

const email = require("helper/email");
const config = require("config");
const MAC_SERVER_ADDRESS = config.icloud.server_address;
const MACSERVER_AUTH = config.icloud.secret; // The Macserver Authorization secret from config

module.exports = async () => {

  setInterval(async () => {
    console.log(clfdate(), "Checking Mac server stats");
    try {
      // fetching stats
      const res = await fetch(MAC_SERVER_ADDRESS + "/stats", {
        headers: { Authorization: MACSERVER_AUTH },
      });
      const stats = await res.json();

      // email.WARNING_LOW_DISK_SPACE(null, { disks }, function (err) {
      //   if (err) console.log(clfdate(), err);
      // });

      console.log(clfdate(), "Mac server stats: ", stats);
    } catch (error) {
      console.log(clfdate(), "Error connecting to mac server: ", error);
    }
  }, 1000 * 15); // 15 seconds
};
