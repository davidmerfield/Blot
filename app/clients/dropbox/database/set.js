var key = require('./key');
var get = require('./get');
var redis = require('redis');
var ensure = require('helper').ensure;

module.exports = function (blog_id, account, callback) {

  ensure(blog_id, 'string')
    .and(account, 'object')
    .and(callback, 'function');

  get(blog_id, function(err, existing_account){

    if (err) return callback(err);

    var multi = redis.multi();

    if (account.id) {
      multi.sadd(key.blogs(account.id), blog_id);
    }

    if (existing_account && existing_account.id && existing_account.id !== account.id) {
      multi.srem(key.blogs(existing_account.id), blog_id);
    }

    multi.hmset(key.account(blog_id), account);

    multi.exec(callback);
  });
};