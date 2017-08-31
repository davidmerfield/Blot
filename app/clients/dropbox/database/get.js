var redis = require('client');
var ensure = require('helper').ensure;
var key = require('./key');

module.exports = function (blog_id, callback) {

  ensure(blog_id, 'string')
    .and(callback, 'function');

  redis.hgetall(key.account(blog_id), callback);
};