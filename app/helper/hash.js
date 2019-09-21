var crypto = require("crypto");

module.exports = function(str) {
  return crypto
    .createHash("md5")
    .update(str)
    .digest("hex");
};
