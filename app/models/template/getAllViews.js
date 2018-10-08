var redis = require("client");
var ensure = require("helper").ensure;
var key = require("./key");
var getMetadata = require("./getMetadata");
var getMultipleViews = require("./getMultipleViews");

module.exports = function getAllViews(name, callback) {
  ensure(name, "string").and(callback, "function");

  redis.smembers(key.allViews(name), function(err, viewNames) {
    getMultipleViews(name, viewNames, function(err, views) {
      getMetadata(name, function(err, metadata) {
        callback(err, views, metadata);
      });
    });
  });
};
