var config = require('../config');
var helper = require('./helper');
var ensure = helper.ensure;
var logger = helper.logger;
var redis = require('redis').createClient();
var Blog = require('./models/blog');
var crypto = require('crypto');

var routeName = 'OTP';
var EXPIRY = 60 * 60 * 24; // one day

// called from command line
if (require.main === module) {

  var handle = process.argv[2];

  if (!handle) throw 'Please pass the user\'s handle or email as an argument.';

  logger(handle, 'Generating one time auth');

  if (handle.indexOf('@') > -1) {

    var email = handle;

    return generate(email, function(err, token){

      if (err) throw err;

      logger(email, 'One time auth:', authURL(token, 'try-blot'));
    });
  }

  Blog.get({handle: handle}, function(err, blog){

    if (!blog) throw 'There is no user with the handle ' + handle;

    generate(blog.owner, function(err, token){

      if (err) throw err;

      logger(blog.owner, 'One time auth:', authURL(token));
    });
  });
}

// Identifier is a UID or email address typically
// ensures the OTA can only be used for one user
function generate (identifier, callback) {

  ensure(identifier, 'string')
    .and(callback, 'function');

  crypto.randomBytes(256, function(err, buf) {

    if (err) return callback(err);

    var now = Date.now()+'';
    var token = crypto.createHash('sha256')
                  .update(identifier)
                  .update(buf)
                  .update(now)
                  .digest("hex");

    redis.set(authKey(token), identifier, function(err, stat){

      if (err) return callback(err);

      redis.expire(authKey(token), EXPIRY, function(err, stat){

        if (err) return callback(err);

        return callback(null, token)
      });
    });
  });
}

function validate (token, callback) {

  ensure(token, 'string')
    .and(callback, 'function');

  redis.get(authKey(token), function(err, identifier){

    if (err || !identifier) {
      return callback('One time authentication failed, redirecting to traditional auth');
    }

    redis.del(authKey(token), function(err, stat){

      if (err) {
        return callback('Could not remove OTA token');
      }

      logger(identifier, 'Authentication successful using one time pass', token);
      return callback(null, identifier);
    });
  });
}

function authKey (token) {
  return routeName + ':' + token;
}

function authURL (token, route) {
  return 'https://' + config.host + '/' + (route || routeName) +'/' + token;
}

module.exports = {
  generate: generate,
  validate: validate
};