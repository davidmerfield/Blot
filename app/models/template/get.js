var redis = require("client");
var key = require("./key");
var deserialize = require("./util/deserialize");
var model = require("./model");
var debug = require("debug")("template:get");

module.exports = function get(id, callback) {
  debug(id);

  redis.hgetall(key.metadata(id), function(err, metadata) {
    if (err) return callback(err);

    try {
      metadata = deserialize(metadata, model);
    } catch (e) {
      return callback(e);
    }

    debug(metadata);
    return callback(null, metadata);
  });
};
