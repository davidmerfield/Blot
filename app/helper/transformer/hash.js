var fs = require("fs-extra");
var crypto = require("crypto");
var debug = require("debug")("blot:helper:transformer:hash");

module.exports = function(path, callback) {
  var hash;

  fs.createReadStream(path)
    .pipe(crypto.createHash("sha1").setEncoding("hex"))
    .on("error", callback)
    .on("finish", function() {
      hash = this.read();
      debug(path, "hashed to", hash);
      callback(null, hash);
    });
};
