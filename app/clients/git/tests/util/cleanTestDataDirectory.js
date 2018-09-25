var fs = require('fs-extra');

module.exports =  function cleanTestDataDirectory (done) {

  fs.emptyDir(require('./testDataDirectory'), done);
};