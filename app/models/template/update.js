var helper = require("helper");
var ensure = helper.ensure;
var key = require("./key");
var redis = require("client");
var makeID = require("./makeID");
var setMetadata = require("./setMetadata");

module.exports = function update(owner, name, metadata, callback) {
  ensure(owner, "string")
    .and(name, "string")
    .and(metadata, "object")
    .and(callback, "function");

  var id = makeID(owner, name);

  if (metadata.isPublic) {
    redis.sadd(key.publicTemplates(), id);
  } else {
    redis.srem(key.publicTemplates(), id);
  }

  return setMetadata(id, metadata, callback);
};
