var client = require("client");
var key = require("./key");

module.exports = function(templateID, callback) {
  var multi;

  client.smembers(key.allViews(templateID), function(err, viewIDs) {
    if (err) return callback(err);
    client.del(
      key.allViews(templateID),
      viewIDs.map(key.view.bind(null, templateID)),
      callback
    );
  });
};
