var key = require("./key");
var client = require("client");
var get = require("./get");
var view = require("./view");
var debug = require("debug")("template:delete");

module.exports = function drop(templateID, callback) {
  var multi;

  get(templateID, function(err, template) {
    if (err || !template) return callback(err || new Error("No template"));

    view.dropAll(templateID, function(err) {
      if (err) return callback(err);

      multi = client.multi();

      multi.srem(key.blogTemplates(template.owner), templateID);
      multi.srem(key.publicTemplates, templateID);
      multi.del(key.metadata(templateID));

      multi.exec(function(err) {
        if (err) return callback(err);

        debug("Deleted " + templateID);
        callback(null);
      });
    });
  });
};
