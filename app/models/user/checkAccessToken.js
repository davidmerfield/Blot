var client = require("client");
var key = require("./key");

module.exports = function (token, callback) {
  client.get(key.accessToken(token), function (err, value) {
    if (err || !value) return callback(new Error("Invalid access token"));

    client.del(key.accessToken(token), function (err) {
      if (err) throw err;

      callback(null, value);
    });
  });
};
