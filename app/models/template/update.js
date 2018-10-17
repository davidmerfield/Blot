var debug = require("debug")("template:update");
var helper = require("helper");
var ensure = helper.ensure;
var key = require("./key");
var client = require("client");
var model = require("./model");
var serialize = require("./util/serialize");
var deserialize = require("./util/deserialize");

module.exports = function update(templateID, metadata, callback) {
  var multi, template;

  debug("ID:", templateID, "Metadata:", metadata);

  client.exists(key.metadata(templateID), function(err, exists) {
    if (err) return callback(err);

    if (!exists) {
      err = new Error(templateID + " not found, call create");
      err.code = "ENOENT";
      return callback(err);
    }

    try {
      ensure(metadata, model);

      multi = client.multi();
      multi.hmset(key.metadata(templateID), serialize(metadata, model));

      // Note that since we can update only a few properties of a template
      // at a single time, metadata.isPublic might be undefined, hence this:
      if (metadata.isPublic === true)
        multi.sadd(key.publicTemplates, templateID);
      if (metadata.isPublic === false)
        multi.srem(key.publicTemplates, templateID);

      // This must come last in pipeline so the .pop() further down works
      multi.hgetall(key.metadata(templateID));
    } catch (err) {
      return callback(err);
    }

    multi.exec(function(err, result) {
      if (err) return callback(err);

      try {
        template = deserialize(result.pop(), model);
        callback(null, template);
      } catch (err) {
        callback(err);
      }
    });
  });
};
