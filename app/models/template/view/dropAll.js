var getAll = require("./getAll");
var client = require("client");
var key = require("./key");

module.exports = function(id, callback) {
  var multi = client.multi();

  getAll(id, function(err, views) {
    if (err || !views) return callback(err || new Error("No views"));

    multi.del(key.allViews(id));

    for (var i in views) multi.del(key.view(id, views[i].name));

    multi.exec(callback);
  });
};
