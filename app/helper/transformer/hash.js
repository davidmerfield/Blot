var fs = require("fs-extra");
var crypto = require("crypto");

module.exports = function(path, callback) {
  fs.createReadStream(path)
    .pipe(crypto.createHash("sha1").setEncoding("hex"))
    .on("error", callback)
    .on("finish", function() {
      callback(null, this.read());
    });
};
