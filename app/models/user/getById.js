var ensure = require("helper").ensure;
var client = require("client");
var key = require("./key");

module.exports = function getById(uid, callback) {
  ensure(uid, "string").and(callback, "function");

  client.get(key.user(uid), function(err, user) {
    if (err) return callback(err);

    if (!user) return callback(null, null);

    try {
      user = JSON.parse(user);
      ensure(user, "object");
    } catch (err) {
      return callback(new Error("BADJSON"));
    }

    return callback(null, user);
  });
};
