var debug = require("debug")("blot:template:drop");
var key = require("./key");
var client = require("client");
var get = require("./get");
var view = require("./view");

// Used to remove a template. This does not just set a deleted
// flag, it actually removes the template data from Redis.
module.exports = function drop(templateID, callback) {
  debug(templateID);

  get(templateID, function(err, template) {
    if (err) return callback(err);

    if (!template) {
      err = new Error("No template to delete: " + templateID);
      err.code = "ENOENT";
      return callback(err);
    }

    debug(template);
    view.dropAll(templateID, function(err) {
      if (err) return callback(err);

      client
        .multi()
        .srem(key.blogTemplates(template.owner), templateID)
        .srem(key.publicTemplates, templateID)
        .del(key.metadata(templateID))
        .exec(function(err) {
          if (err) return callback(err);

          debug("Deleted " + templateID);
          callback(null);
        });
    });
  });
};
