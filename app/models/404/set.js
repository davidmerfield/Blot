var client = require('../client');
var helper = require('../../helper');
var ensure = helper.ensure;
var key = require('./key');

module.exports = function (blogID, url, callback) {

  callback = callback || function(){};

  ensure(blogID, 'string')
    .and(url, 'string')
    .and(callback, 'function');

  var everythingKey = key.everything(blogID);
  var score = Date.now();

  ensure(everythingKey, 'string')
    .and(score, 'number');

  client.ZADD(everythingKey, score, url, callback);
};