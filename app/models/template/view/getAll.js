var client = require("client");
var key = require("./key");
var deserialize = require("../util/deserialize");
var model = require("./model");

module.exports = function getAll(templateID, callback) {
  var batch;

  client.smembers(key.allViews(templateID), function(err, viewIDs) {
    if (err) return callback(err);

    batch = client.batch();

    try {
      viewIDs.forEach(function(viewID) {
        batch.hgetall(key.view(templateID, viewID));
      });
    } catch (err) {
      callback(err);
    }

    batch.exec(function(err, res) {
      if (err) return callback(err);

      try {
        res = res.map(function(view) {
          return deserialize(view, model);
        });
      } catch (err) {
        return callback(err);
      }

      return callback(null, res);
    });
  });
};
