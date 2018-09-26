var helper = require('../../app/helper');
var fs = require('fs-extra');

module.exports = function (done) {

  var context = this;

  var tmp = helper.tempDir() + this.blog.handle;

  context.tmp = tmp;

  fs.emptyDir(tmp, done);
};
