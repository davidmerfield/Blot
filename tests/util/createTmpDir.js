var tempDir = require("helper/tempDir");
var fs = require("fs-extra");

module.exports = function (done) {
  var context = this;

  var tmp = tempDir() + this.blog.handle;

  context.tmp = tmp;

  fs.emptyDir(tmp, done);
};
