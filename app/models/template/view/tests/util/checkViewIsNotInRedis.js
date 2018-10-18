var key = require("../../key");
var client = require("client");
module.exports = function(templateID, viewID, callback) {
  var allViews = key.allViews(templateID);
  var viewKey = key.view(templateID, viewID);
  client.sismember(allViews, viewID, function(err, stat) {
    if (err) return callback(err);
    expect(stat).toEqual(0);
    client.exists(viewKey, function(err, stat) {
      if (err) return callback(err);
      expect(stat).toEqual(0);
      callback();
    });
  });
};
