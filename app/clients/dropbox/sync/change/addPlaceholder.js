var helper = require('helper');
var ensure = helper.ensure;
var fs = require('fs-extra');
var mtime = require('./mtime');

module.exports = function(path, modified, callback) {

  ensure(path, 'string')
    .and(modified, 'string')
    .and(callback, 'function');

  fs.outputFile(path, '', function(err){

    if (err) return callback(err);

    mtime(path, modified, callback);
  });
};

