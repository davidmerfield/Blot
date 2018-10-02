var config = require('config');
var https = require('https');
var Dropbox = require('dropbox');
var callback_uri = require('./callback_uri');

module.exports = function (req, res, next){

  if (!req.query || !req.query.code) {
    return next(new Error('No code from Dropbox'));
  }
    
  var code = req.query.code;
  var key = config.dropbox.app.key;
  var secret = config.dropbox.app.secret;
  var redirect_uri = callback_uri(req);
  var full_access = req.query.full_access === 'true';

  if (full_access) {
    key = config.dropbox.full.key;
    secret = config.dropbox.full.secret;
    redirect_uri += '?full_access=true';
  }

  var options = {
    hostname: 'api.dropboxapi.com',
    path: '/oauth2/token?code=' + code + '&grant_type=authorization_code&redirect_uri=' + redirect_uri,
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + new Buffer(key + ':' + secret).toString('base64')
    }
  };

  make_request(options, function(err, account_id, access_token){

    if (err) return next(err);

    get_email(access_token, function(err, email){

      if (err) return next(err);

      req.new_account = {
        account_id: account_id,
        access_token: access_token,
        email: email,
        error_code: 0,
        last_sync: Date.now(),
        full_access: full_access,
        folder: '',
        folder_id: '',
        cursor: ''
      };

      next();
    });
  });
};

function make_request (options, callback) {

  var request;
  var raw;
  var parsed = {};

  request = https.request(options, function (data) {

    raw = '';

    data.on('data', function (chunk) {raw += chunk;});

    data.on('end', function ()  {

      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        return callback(e);
      }

      return callback(null, parsed.account_id, parsed.access_token);
    });
  });

  request.end();
}

function get_email (access_token, callback) {

  var client = new Dropbox({accessToken: access_token});

  client.usersGetCurrentAccount()

    .then(function(response){
      callback(null, response.email);
    })

    .catch(callback);
}