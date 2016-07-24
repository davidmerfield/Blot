var helper = require('../../../helper');
var ensure = helper.ensure;
var fs = require('fs');

var mtime = require('./mtime');
var mkdirp = helper.mkdirp;

var NOTHING = '';
var ENCODING = 'utf-8';

module.exports = function(path, modified, callback) {

  ensure(path, 'string')
    .and(modified, 'string')
    .and(callback, 'function');

  var parent = path.slice(0, path.lastIndexOf('/'));

  mkdirp(parent, function(err){

    if (err) throw err;

    fs.writeFile(path, NOTHING, ENCODING, function(err){

      if (err) return callback(err);

      mtime(path, modified, callback);
    });
  });
};

