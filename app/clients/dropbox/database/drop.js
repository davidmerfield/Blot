var get = require('./get');
var key = require('./key');
var redis = require('redis');
var ensure = require('helper').ensure;

module.exports = function (blog_id, callback) {

  ensure(blog_id, 'string')
    .and(callback, 'function');

  get(blog_id, function(err, account){

    var multi = redis.multi();

    if (account && account.account_id)
      multi.srem(key.blogs(account.account_id), blog_id);

    multi.del(key.account(blog_id));

    multi.exec(callback);
  });
};