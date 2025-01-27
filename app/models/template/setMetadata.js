var key = require("./key");
var client = require("models/client");
var getMetadata = require("./getMetadata");
var serialize = require("./util/serialize");
var metadataModel = require("./metadataModel");
var ensure = require("helper/ensure");
var Blog = require("models/blog");

module.exports = function setMetadata (id, updates, callback) {
  try {
    ensure(id, "string").and(updates, "object").and(callback, "function");
  } catch (e) {
    return callback(e);
  }

  getMetadata(id, function (err, metadata) {
    var changes;

    metadata = metadata || {};

      
    for (var i in updates) {
      if (metadata[i] !== updates[i]) changes = true;
      metadata[i] = updates[i];
    }

    if (!metadata.owner) return callback(new Error("No owner: please specify an owner for this template"));

    metadata = serialize(metadata, metadataModel);

    if (metadata.isPublic) {
      client.sadd(key.publicTemplates(), id);
    } else {
      client.srem(key.publicTemplates(), id);
    }

    client.sadd(key.blogTemplates(metadata.owner), id, function (err) {
      if (err) return callback(err);

      client.hmset(key.metadata(id), metadata, function (err) {
        if (err) return callback(err);

        if (!changes) return callback(null, changes);

        if (metadata.isPublic || metadata.owner === "SITE") {
          return callback(null, changes);
        }

        Blog.set(metadata.owner, { cacheID: Date.now() }, function (err) {
          callback(err, changes);
        });
      });
    });
  });
};
