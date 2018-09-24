var fs = require('fs-extra');

module.exports = function (done) {
  fs.emptyDir(__dirname + '/../data', done);
};