var key = require("./key");
var client = require("client");
var get = require("./get");
var getAll = require("./view/getAll");
var debug = require("debug")("template:delete");

module.exports = function drop(id, callback) {
  var multi;

  get(id, function(err, template) {
    if (err || !template) return callback(err || new Error("No template"));

    getAll(id, function(err, views) {
      if (err || !views) return callback(err || new Error("No views"));

      multi = client.multi();

      multi.srem(key.blogTemplates(template.owner), id);
      multi.srem(key.publicTemplates, id);
      multi.del(key.metadata(id));
      multi.del(key.allViews(id));

      for (var i in views) multi.del(key.view(id, views[i].name));

      multi.exec(function(err) {
        if (err) return callback(err);

        debug("Deleted " + id);
        callback(null);
      });
    });
  });
};
