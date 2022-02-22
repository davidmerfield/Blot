var crypto = require("crypto");
var client = require("client");
var key = require("./key");

var LENGTH = 16; // characters long

module.exports = function generateAccessToken({ uid, expires }, callback) {
  crypto.randomBytes(LENGTH, function (err, token) {
    if (err) return callback(err);

    token = token.toString("hex");

    const value = uid || 1;
    const seconds = expires || 60 * 60 * 24; // one day

    client.SETEX(key.accessToken(token), seconds, value, function (err) {
      if (err) return callback(err);

      callback(null, token);
    });
  });
};
