var crypto = require("crypto");
var client = require("client");
var key = require("./key");

var LENGTH = 16; // characters long
var EXPIRE = 24 * 60 * 60; // 24 hrs

module.exports = function(uid, callback) {
  crypto.randomBytes(LENGTH, function(err, token) {
    if (err) return callback(err);

    token = token.toString("hex");

    client.SETEX(key.accessToken(token), EXPIRE, uid, function(err) {
      if (err) return callback(err);

      return callback(null, token);
    });
  });
};
