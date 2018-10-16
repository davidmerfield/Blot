var redis = require("client");
var key = require("./key");
var model = require("./model");
var deserialize = require("../util/deserialize");

module.exports = function get(name, viewName, callback) {
  redis.hgetall(key.view(name, viewName), function(err, view) {
    if (!view) {
      var message = "No view called " + viewName;
      return callback(new Error(message));
    }

    view = deserialize(view, model);

    callback(err, view);
  });
};
