var redis = require("client");
var key = require("./key");
var getMultipleViews = require("./getMultipleViews");

module.exports = function getAll(name, callback) {
  if (!name) return callback(null, [], {});

  redis.smembers(key.allViews(name), function(err, viewNames) {
    getMultipleViews(name, viewNames, callback);
  });
};
