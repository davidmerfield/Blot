var redis = require("client");
var ensure = require("helper").ensure;
var key = require("./key");
var deserialize = require("./deserialize");
var model = require("./model");

module.exports = function getMetadata(id, callback) {
  ensure(id, "string").and(callback, "function");

  redis.hgetall(key.metadata(id), function(err, metadata) {
    if (err) return callback(err);

    metadata = deserialize(metadata, model.metadata);

    return callback(null, metadata);
  });
};
