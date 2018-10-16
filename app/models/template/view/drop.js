var redis = require("client");
var ensure = require("helper").ensure;
var key = require("./key");

module.exports = function drop(templateID, viewName, callback) {
  ensure(templateID, "string")
    .and(viewName, "string")
    .and(callback, "function");

  redis.del(key.view(templateID, viewName), function(err) {
    if (err) throw err;

    redis.srem(key.allViews(templateID), viewName, function(err) {
      if (err) throw err;

      callback();
    });
  });
};
