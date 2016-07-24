var mkdirp = require('mkdirp');
var ensure = require('./ensure');

module.exports = function (path, callback) {

  ensure(path, 'string')
    .and(callback, 'function');

  mkdirp(path, function(err, stat){

    // We suppress EEXIST errors...
    // don't care if the directory
    // already exists...
    if (err && err.code !== 'EEXIST')
      return callback(err);

    return callback(null, stat);
  });
};