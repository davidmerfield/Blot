var client = require('../client');
var helper = require('../../helper');
var Log = helper.logg;
var ensure = helper.ensure;

var key = require('./_key');

// Returns a callback with
// err, url, contents
module.exports = function drop (blogID, path, callback) {

  ensure(blogID, 'string')
    .and(path, 'string')
    .and(callback, 'function');

  var log = new Log('Blog: ' + blogID);

  // This generates a normalized
  // path (lowercased, URI decoded)
  var pathKey = key.path(blogID, path);
  var everythingKey = key.everything(blogID);

  client
    .multi()
    .DEL(pathKey)
    .SREM(everythingKey, pathKey)
    .exec(function(err, res){

      if (err)
        return callback(err);

      if (res.length)
        log.debug('Removed path key ' + path);

      callback();
    });
};