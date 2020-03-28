var client = require("client");
var key = require("./key");

module.exports = function(token, callback) {
  client.get(key.accessToken(token), function(err, uid) {
    if (err) return callback(err);

    if (!uid) return callback(null, null);

    client.del(key.accessToken(token), function(err) {
      if (err) return callback(err);

      return callback(null, uid);
    });
  });
};
