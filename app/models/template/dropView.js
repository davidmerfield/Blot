var key = require("./key");
var client = require("client");

module.exports = function dropView(templateID, viewName, callback) {
  client.del(key.view(templateID, viewName), function(err) {
    if (err) throw err;

    client.srem(key.allViews(templateID), viewName, function(err) {
      if (err) throw err;

      callback();
    });
  });
};
