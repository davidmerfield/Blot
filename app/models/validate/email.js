module.exports = function(uid, email, callback){

  var ensure = require('../../helper').ensure;

  ensure(uid, 'string')
    .and(email, 'string')
    .and(callback, 'function');

  email = email.replace(' ', '');

  if (!email)
    return callback('Please enter an email');

  var emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;

  if (!emailRegex.test(email))
    return callback('Please enter a valid email');

  return callback(null, email)
}