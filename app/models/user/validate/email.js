var ensure = require("helper").ensure;
var getByEmail = require("../getByEmail");

module.exports = function(user, email, callback) {
  ensure(user, "object")
    .and(email, "string")
    .and(callback, "function");

  // Normalize the email, case sensitivity confuses users
  email = email
    .trim()
    .toLowerCase()
    .replace(" ", "");

  if (!email) return callback(new Error("Please enter an email"));

  var emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;

  if (!emailRegex.test(email))
    return callback(new Error("Please enter a valid email"));

  getByEmail(email, function(err, otheruser) {
    if (err) return callback(err);

    if (otheruser && otheruser.uid !== user.uid) {
      err = new Error("This email is in use.");
      err.code = "EEXISTS";
      return callback(err);
    }

    // this email is free!
    return callback(null, email);
  });
};
