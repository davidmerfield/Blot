var ensure = require('helper').ensure;
var getByEmail = require('../getByEmail');

module.exports = function (user, email, callback) {

  ensure(user, 'object')
    .and(email, 'string')
    .and(callback, 'function');

  email = email.replace(' ', '');

  if (!email)
    return callback(new Error('Please enter an email'));

  var emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;

  if (!emailRegex.test(email))
    return callback(new Error('Please enter a valid email'));

  getByEmail(email, function(err, otheruser){

    if (err) return callback(err);

    if (otheruser && otheruser.uid !== user.uid) return callback(new Error('This email is in use.'));

    // this email is free!
    return callback(null, email);
  });
};