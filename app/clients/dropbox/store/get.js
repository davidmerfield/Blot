var redis = require('client');

module.exports = function (blogID, callback) {
  redis.hgetall(key.all(blogID), callback);
}