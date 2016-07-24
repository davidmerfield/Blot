var helper = require('../helper');
var ensure = helper.ensure;
var callOnce = helper.callOnce;

var fs = require('fs');
var crypto = require('crypto');

module.exports = function (path, callback) {

  ensure(path, 'string')
    .and(callback, 'function');

  callback = callOnce(callback);

  var hash = crypto.createHash('sha1');
      hash.setEncoding('hex');

  var fd = fs.createReadStream(path);
      fd.pipe(hash);

  fd.on('error', callback);

  fd.on('end', function() {
    hash.end();
    callback(null, hash.read());
  });
};