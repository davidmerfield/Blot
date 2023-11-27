var fs = require("fs-extra");
var crypto = require("crypto");
var debug = require("debug")("blot:helper:transformer:hash");

module.exports = function (path, callback) {
  var hash;

  fs.createReadStream(path)
    .on("error", callback)
    .pipe(crypto.createHash("sha1").setEncoding("hex"))
    .on("finish", function () {
      hash = this.read();
      debug(path, "hashed to", hash);
      callback(null, hash);
    });
};
