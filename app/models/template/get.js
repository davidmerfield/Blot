var client = require("client");
var key = require("./key");
var deserialize = require("./util/deserialize");
var model = require("./model");
var debug = require("debug")("blot:template:get");

module.exports = function get(templateID, callback) {
  debug(templateID);

  client.hgetall(key.metadata(templateID), function(err, metadata) {
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
