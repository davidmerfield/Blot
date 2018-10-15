var redis = require("client");
var ensure = require("helper").ensure;
var key = require("./key");
var get = require("./get");
var getMultipleViews = require("./getMultipleViews");

module.exports = function getAllViews(name, callback) {
  if (!name) return callback(null, [], {});

  redis.smembers(key.allViews(name), function(err, viewNames) {
    getMultipleViews(name, viewNames, function(err, views) {
      get(name, function(err, metadata) {
        callback(err, views, metadata);
      });
    });
  });
};
