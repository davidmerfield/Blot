var config = require('config');
var https = require('https');
var Dropbox = require('dropbox');
var callback_uri = require('./callback_uri');

module.exports = function extract_token (req, res, next){

  if (req.session.new_account) {
    req.new_account = req.session.new_account;
    delete req.session.new_account;
    return next();
  }

  var key, secret, token, id;

  console.log('FULL', req.query.full);

  var full = !!req.query.full;

  if (full) {
    key = config.dropbox.full.key;
    secret = config.dropbox.full.secret;
  } else {
    key = config.dropbox.app.key;
    secret = config.dropbox.app.secret;
  }

  var option = {
    code: req.query.code,
    callback_uri: callback_uri(req),
    clientId: key,
    secret: secret
  };

  if (full) option.callback_uri += '?full=true';

  var request, raw, parsed;

  var options = {
    hostname: 'api.dropboxapi.com',
    path: `/oauth2/token?code=${option.code}&grant_type=authorization_code&redirect_uri=${option.callback_uri}`,
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + new Buffer(option.clientId + ':' + option.secret).toString('base64')
    }
  };

  request = https.request(options, function (data) {

    raw = '';

    data.on('data', function (chunk) {raw += chunk;});

    data.on('end', function ()  {

      try {

        // if we need to access the user's dropbox
        // UID or account id, we could do that here
        // but for now we just care about the access token
        parsed = JSON.parse(raw);
        console.log(parsed);
        id = parsed.account_id;
        token = parsed.access_token;

      } catch (e) {

        return next(e);
      }

      if (!token || !id) return next(new Error('Invalid Token'));

      var client = new Dropbox({accessToken: token});

      client.usersGetAccount({account_id: id})

        .then(function(response){

          req.new_account = {
            id: id,
            token: token,
            cursor: '',
            valid: Date.now(),
            email: response.email,
            full: full,
            folder: ''
          };

          return next();
        })

        .catch(next);
    });
  });

  request.end();
};