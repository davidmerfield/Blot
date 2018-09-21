var testDataDirectory = require('./testDataDirectory');
    var fs = require('fs-extra');

module.exports =  function cleanTestDataDirectory (done) {
    fs.emptyDir(testDataDirectory, done);
  };