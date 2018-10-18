var redis = require("client");
var key = require("./key");
var model = require("./model");
var deserialize = require("../util/deserialize");
var async = require("async");

module.exports = function get(templateID, viewID, options, callback) {
  if (typeof callback === "undefined" && typeof options === "function") {
    callback = options;
    options = {};
  }

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
