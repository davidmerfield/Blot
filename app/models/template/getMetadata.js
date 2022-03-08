var key = require("./key");
var client = require("client");
var deserialize = require("./util/deserialize");
var metadataModel = require("./metadataModel");

module.exports = function getMetadata(id, callback) {
  client.hgetall(key.metadata(id), function (err, metadata) {
    if (err) return callback(err);

    if (!Object.keys(metadata).length) {
      err = new Error("No template: " + id);
      err.code = "ENOENT";
      return callback(err, null);
    }

    metadata = deserialize(metadata, metadataModel);

    callback(null, metadata);
  });
};
