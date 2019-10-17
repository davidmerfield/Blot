var key = require("./key");
var client = require("client");
var ensure = require("helper").ensure;
var getMultipleViews = require("./getMultipleViews");
var getMetadata = require("./getMetadata");

module.exports = function getAllViews(name, callback) {
  ensure(name, "string").and(callback, "function");

  client.smembers(key.allViews(name), function(err, viewNames) {
    getMultipleViews(name, viewNames, function(err, views) {
      getMetadata(name, function(err, metadata) {
        callback(err, views, metadata);
      });
    });
  });
};
