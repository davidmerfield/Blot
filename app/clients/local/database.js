var redis = require('redis');
var key = 'client:local:paths';

module.exports = {

  drop: function (blog_id, callback) {

    redis.hdel(key, blog_id, callback);
  },

  get_all: function(callback) {

    redis.hgetall(key, callback);
  },

  get: function (blog_id, callback) {

    redis.hget(key, blog_id, callback);
  },

  set: function (blog_id, path, callback) {

    redis.hset(key, blog_id, path, callback);
  }

};