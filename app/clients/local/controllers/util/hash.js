var fs = require("fs-extra");
var crypto = require("crypto");

module.exports = function hash(path) {
  return crypto
    .createHash("md5")
    .update(fs.readFileSync(path))
    .digest("hex");
};
