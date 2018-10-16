var debug = require("debug")("template:update");
var helper = require("helper");
var ensure = helper.ensure;
var key = require("./key");
var client = require("client");
var makeID = require("./util/makeID");
var model = require("./model");
var serialize = require("./util/serialize");
var deserialize = require("./util/deserialize");

module.exports = function update(id, metadata, callback) {
  var metadataString, template;

  debug("ID:", id,  "Metadata:", metadata);

  try {
    ensure(metadata, model);
    metadataString = serialize(metadata, model);
  } catch (err) {
    return callback(err);
  }

  client.exists(key.metadata(id), function(err, exists) {
    if (err) return callback(err);
    if (!exists) return callback(new Error(id + " not found, call create"));
    client
      .multi()
      .hmset(key.metadata(id), metadataString)
      .hgetall(key.metadata(id))
      .exec(function(err, res) {
        if (err) return callback(err);

        try {
          template = deserialize(res[1], model);
        } catch (err) {
          return callback(err);
        }

        callback(null, template);
      });
  });
};
