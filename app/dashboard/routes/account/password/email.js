var NOTOKEN = 'Could not generate a token';
var format = require('url').format;
var ensure = require('helper').ensure;
var generateAccessToken = require('user').generateAccessToken;
var Email = require('email');
var config = require('config');

module.exports = function (uid, callback) {

  ensure(uid, 'string')
    .and(callback, 'function');

  var url;

  generateAccessToken(uid, function(err, token){

    if (err || !token) return callback(err || new Error(NOTOKEN));

    // The full one-time log-in link to be sent to the user
    url = format({
      protocol: 'https',
      host: config.host,
      pathname: '/log-in',
      query: {
        token: token,
        then: '/account/set-password'
      }
    });

    Email.SET_PASSWORD(uid, {url: url}, callback);
  });
};