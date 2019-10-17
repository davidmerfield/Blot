var bcrypt = require("bcryptjs");

module.exports = function(password, callback) {
  bcrypt.hash(password, 10, callback);
};
