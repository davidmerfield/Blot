var redis = require('client');
var ensure = require('helper').ensure;
var key = require('./key');
var model = require('./model');

module.exports = function (blog_id, callback) {

  ensure(blog_id, 'string')
    .and(callback, 'function');

  redis.hgetall(key.account(blog_id), function(err, account){

    if (err) return callback(err, null);

    if (!account) return callback(null, null);

    // Restore the types of the
    // account properties before calling back.
    for (var i in model) {

      if (model[i] === 'number')
        account[i] = parseInt(account[i]);

      if (model[i] === 'boolean')
        account[i] = account[i] === 'true';

    }

    return callback(null, account);
  });
};