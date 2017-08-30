var db = require('dropbox');
var saveCredentials = require('./change-dropbox/save-credentials.js');
var migrateFolder = require('./migrateFolder');
var config = require('config');
var Dropbox = new db({"clientId": config.dropbox.key, "secret": config.dropbox.secret});
var https = require('https');
var Blog = require('blog');
var Store = require('store');

var authenticate = require('express').Router();

authenticate.get('/redirect', function(req, res){

  var consentUri = Dropbox.getAuthenticationUrl(redirectUri, null, 'code');
  var redirectUri = req.protocol + '://' + req.get('host') + req.baseUrl;

  if (req.query.change_account)
    req.session.change_account = true;

  consentUri = consentUri.replace('response_type=token', 'response_type=code');

  return res.redirect(consentUri);
});

authenticate.get('/', function(req, res, next){

  var redirectUri = req.protocol + '://' + req.get('host') + req.baseUrl;
  var options = {
    code: req.query.code,
    redirectUri: redirectUri,
    clientId: config.dropbox.key,
    secret: config.dropbox.secret
  };

  getAccessToken(options, function(err, token, id){

    if (err) return next(err);

    if (!token) return next(new Error('No accessToken :('));

    if (req.session.change_account) {
      delete req.session.change_account;
      return saveCredentials(token, id, req, res, next);
    }

    Store.getByAccountId(id, function(err, blogs){

      if (err) return next(err);

      var folder;

      if (blogs.length > 0) {
        folder = '/' + req.blog.handle;
      } else {
        folder = '/';
      }

      migrateFolder(req.blog, blogs, function(err, newFolder){

        if (err) return next(err);

        var updates = {
          folder: newFolder,
          dropbox: {
            token: token,
            cursor: '',
            id: id
          },
        };

        Blog.set(req.blog.id, {updates}, function(err){

          if (err) return next(err);

          return res.redirect('/');
        });
      });
    });
  });
});


function getAccessToken (option, callback) {

  var request, raw, parsed, accessToken, account_id;

  var options = {
    hostname: 'api.dropboxapi.com',
    path: `/oauth2/token?code=${option.code}&grant_type=authorization_code&redirect_uri=${option.redirectUri}`,
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
        account_id = parsed.account_id;
        accessToken = parsed.access_token;

      } catch (e) {
        return callback(e);
      }

      return callback(null, accessToken, account_id);
    });
  });

  request.end();
}



module.exports = authenticate;