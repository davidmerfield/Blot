var key = require('./key');
var get = require('./get');
var redis = require('client');
var ensure = require('helper').ensure;
var model = require('./model');

module.exports = function (blog_id, changes, callback) {

  ensure(blog_id, 'string')
    .and(changes, 'object')
    .and(callback, 'function');

  var multi = redis.multi();

  get(blog_id, function(err, account){

    if (err) return callback(err);

    account = account || {};

    // The user's account has changed,
    // remove the old one and add the new one
    if (account.account_id && changes.account_id && account.account_id !== changes.account_id)
      multi.srem(key.blogs(account.account_id), blog_id);

    for (var i in changes)
      account[i] = changes[i];

    if (changes.account_id)
      multi.sadd(key.blogs(changes.account_id), blog_id);

    ensure(account, model, true);

    multi.hmset(key.account(blog_id), account);
    multi.exec(callback);
  });
};