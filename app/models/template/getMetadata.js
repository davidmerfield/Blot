var key = require("./key");
var client = require("client");
var deserialize = require("./util/deserialize");
var metadataModel = require("./metadataModel");

module.exports = function getMetadata(id, callback) {
  client.hgetall(key.metadata(id), function(err, metadata) {
    if (err) return callback(err);

    metadata = deserialize(metadata, metadataModel);

    return callback(null, metadata);
  });
};
