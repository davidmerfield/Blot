var fs = require('fs-extra');
var testDataDirectory = require('./testDataDirectory');

module.exports =  function cleanTestDataDirectory (done) {

  fs.emptyDir(testDataDirectory(this.blog.id), done);
};