var Dropbox = require('dropbox');
var config = require('config');
var https = require('https');
var database = require('database');
var prepare_folder = require('./prepare_folder');
var authenticate = require('express').Router();

authenticate.use(function(req, res, next){
  req.callback_uri = req.protocol + '://' + req.get('host') + req.baseUrl;
  next();
});

authenticate.get('/redirect', function(req, res){

  var consent_uri;
  var client = new Dropbox({"clientId": config.dropbox.key, "secret": config.dropbox.secret});

  consent_uri = client.getAuthenticationUrl(req.callback_uri, null, 'code');
  consent_uri = consent_uri.replace('response_type=token', 'response_type=code');

  return res.redirect(consent_uri);
});

authenticate.use(function(req, res, next){

  var option = {
    code: req.query.code,
    callback_uri: req.callback_uri,
    clientId: config.dropbox.key,
    secret: config.dropbox.secret
  };

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

        console.log(raw);

        // if we need to access the user's dropbox
        // UID or account id, we could do that here
        // but for now we just care about the access token
        parsed = JSON.parse(raw);
        req.account_id = parsed.account_id;
        req.token = parsed.access_token;

      } catch (e) {

        return next(e);
      }

      return next();
    });
  });

  request.end();
});

authenticate.get('/', function(req, res, next){

  var token = req.token;
  var account_id = req.account_id;
  var blog = req.blog;

  if (!token) return next(new Error('No accessToken :('));

  prepare_folder(blog.id, account_id, function(err, root){

    if (err) return next(err);

    var client = new Dropbox({accessToken: token});

    client.usersGetAccount({account_id: account_id})

      .then(function(response){

        var account = {
          token: token,
          cursor: '',
          email: response.email,
          id: account_id,
          root: root
        };

        database.set(blog.id, account, function(err){

          if (err) return next(err);

          res.redirect('/clients/dropbox');
        });
      })

      .catch(function(err){

        next(err)
      });
  });
});

module.exports = authenticate;