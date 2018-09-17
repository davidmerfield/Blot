var client = require('client');
var helper = require('helper');
var ensure = helper.ensure;
var Key = require('./key');

var MAX_404s = 500;

module.exports = function (blogID, url, callback) {

  callback = callback || function(){};

  ensure(blogID, 'string')
    .and(url, 'string')
    .and(callback, 'function');

  var key = Key.everything(blogID);
  var now = Date.now();
  var thirtyDaysAgo = now - 1000*60*60*24*30;
  var multi = client.multi();

  // Add the new 404
  multi.ZADD(key, now, url);

  // Remove any entries which are older than 30 days
  // -inf is to avoid looking up the lowest score in the sorted set.
  multi.ZREMRANGEBYSCORE(key, '-inf', thirtyDaysAgo);

  // Trim the list of 404s
  multi.ZREMRANGEBYRANK(key, 0, -MAX_404s);

  multi.exec(function(err){

    if (err) throw err;

    callback();
  });
};