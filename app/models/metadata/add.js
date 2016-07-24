var client = require('../client');
var helper = require('../../helper');
var ensure = helper.ensure;
var Log = helper.logg;

var key = require('./_key');

// The purpose of this function is to
// store the case-sensitive version of
// a path to a file on Blot against its
// normalized path. This makes it possible
// to retrieve files with pretty paths.s
module.exports = function add (blogID, path, callback) {

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
    .SET(pathKey, path)
    .SADD(everythingKey, pathKey)
    .exec(function(err, response){

      if (err)
        return callback(err);

      if (response.length)
        log.debug('Stored path ' + path);

      callback();
    });
};