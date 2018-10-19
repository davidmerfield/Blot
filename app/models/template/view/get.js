var redis = require("client");
var key = require("./key");
var model = require("./model");
var deserialize = require("../util/deserialize");

module.exports = function get(templateID, viewID, callback) {
  redis.hgetall(key.view(templateID, viewID), function(err, view) {
    if (!view) {
      var message = "No view called " + viewID;
      return callback(new Error(message));
    }

    try {
      view = deserialize(view, model);
    } catch (err) {
      return callback(err);
    }

    callback(null, view);
  });
};
