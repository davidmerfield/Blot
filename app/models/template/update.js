var helper = require("helper");
var ensure = helper.ensure;
var key = require("./key");
var redis = require("client");
var makeID = require("./makeID");

module.exports = function update(owner, name, metadata, callback) {
  ensure(owner, "string")
    .and(name, "string")
    .and(metadata, "object")
    .and(callback, "function");

  var id = makeID(owner, name);

  if (metadata.isPublic) {
    redis.sadd(key.publicTemplates, id);
  } else {
    redis.srem(key.publicTemplates, id);
  }

  var multi = client.multi();

  get(id, function(err, metadata) {
    var changes;

    metadata = metadata || {};

    for (var i in updates) {
      if (metadata[i] !== updates[i]) changes = true;
      metadata[i] = updates[i];
    }

    ensure(metadata, model.metadata);

    metadata = serialize(metadata, model.metadata);

    if (metadata.isPublic) {
      multi.sadd(key.publicTemplates, id);
    } else {
      multi.srem(key.publicTemplates, id);
    }

    multi.sadd(key.blogTemplates(metadata.owner), id);
    multi.hmset(key.metadata(id), metadata);

    multi.exec(function(err) {
      callback(err, changes);
    });
  });
};
