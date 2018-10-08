var helper = require("helper");
var ensure = helper.ensure;
var model = require("./model");
var key = require("./key");
var redis = require("client");
var getMetadata = require('./getMetadata');
var serialize = require('./serialize');

module.exports = function setMetadata(id, updates, callback) {
  ensure(id, "string")
    .and(updates, "object")
    .and(callback, "function");

  getMetadata(id, function(err, metadata) {
    var changes;

    metadata = metadata || {};

    for (var i in updates) {
      if (metadata[i] !== updates[i]) changes = true;
      metadata[i] = updates[i];
    }

    metadata = serialize(metadata, model.metadata);

    if (metadata.isPublic) {
      redis.sadd(key.publicTemplates(), id);
    } else {
      redis.srem(key.publicTemplates(), id);
    }

    redis.sadd(key.blogTemplates(metadata.owner), id, function(err) {
      if (err) throw err;

      redis.hmset(key.metadata(id), metadata, function(err) {
        if (err) throw err;

        return callback(err, changes);
      });
    });
  });
};
