var key = require("./key");
var client = require("client");
var deserialize = require("./util/deserialize");
var viewModel = require("./viewModel");

module.exports = function getView(name, viewName, callback) {
  client.hgetall(key.view(name, viewName), function(err, view) {
    if (!view) {
      var message = "No view called " + viewName;
      return callback(new Error(message));
    }

    view = deserialize(view, viewModel);

    callback(err, view);
  });
};
