var dataDirectory = require('./dataDirectory');
    var fs = require('fs-extra');

module.exports =  function cleanDataDirectory (done) {
    fs.emptyDir(dataDirectory, done);
  };