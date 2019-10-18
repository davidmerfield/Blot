var bcrypt = require("bcryptjs");
var getById = require("./getById");
var ensure = require("helper").ensure;

module.exports = function(uid, password, callback) {
  ensure(uid, "string")
    .and(password, "string")
    .and(callback, "function");

  getById(uid, function(err, user) {
    if (err || !user) return callback(err || new Error("No user"));

    bcrypt.compare(password, user.passwordHash, callback);
  });
};
