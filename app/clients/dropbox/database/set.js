var key = require('./key');
var get = require('./get');
var redis = require('redis');
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
    if (account.id && account.id !== changes.id)
      multi.srem(key.blogs(account.id), blog_id);

    for (var i in changes)
      account[i] = changes[i];

    if (!account.folder)
      return callback(new Error('Please choose a folder for this account'));

    if (changes.id) multi.sadd(key.blogs(changes.id), blog_id);

    ensure(account, model, true);

    multi.hmset(key.account(blog_id), account);
    multi.exec(callback);
  });
};