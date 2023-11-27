var fs = require("fs-extra");

module.exports = function (done) {
  if (!this.tmp) return done(new Error("No tmp dir to remove!"));

  fs.remove(this.tmp, done);
};
