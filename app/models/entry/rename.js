var helper = require('../../helper');
var ensure = helper.ensure;
var logger = helper.logger;
var redis = require('../client');
var pathKey = require('./key').path;

// This relinks an entry which has the
// property previousPath
module.exports = function rename (blogID, oldPath, newPath, callback) {

  ensure(blogID, 'string')
    .and(oldPath, 'string')
    .and(newPath, 'string')
    .and(callback, 'function');

  var oldKey = pathKey(blogID, oldPath);
  var newKey = pathKey(blogID, newPath);

  redis.rename(oldKey, newKey, function(err, stat){

    // We get this issue if the file was never
    // an entry to being with (and has no key)
    if (err && err.message !== 'ERR no such key') {
      throw err;
    }

    if (!err && stat) {
      logger(null, 'Blog: ' + blogID + ': Renamed entry from', oldPath + ' to ' + newPath);
    }

    callback();
  });
};