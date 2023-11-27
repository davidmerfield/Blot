const crypto = require("crypto");
const fs = require("fs");

module.exports = function getChecksum(path) {
  return new Promise(function (resolve) {
    const hash = crypto.createHash("md5");
    const input = fs.createReadStream(path);

    // Suppress errors, esp. ENOENT and EISDIR
    input.on("error", function () {
      resolve(null);
    });

    input.on("data", function (chunk) {
      hash.update(chunk);
    });

    input.on("close", function () {
      resolve(hash.digest("hex"));
    });
  });
};
