module.exports = function(server){

  // var firstPost = require('./firstPost');
  // var SyncLease = require('../../../../sync/lease');

  var saveCredentials = require('./change-dropbox/save-credentials.js');
  var migrateFolder = require('./migrateFolder');
  var Blog = require('blog');
  var Dropbox = require('dropbox'),
      events = require('events'),
      eventEmitter = new events.EventEmitter(),
      config = require('config'),
      callbackUrl = 'https://' + config.host + '/folder/authenticated';

  server.get('/folder/authenticate', function (request, response) {

    var _session = {};

    // We also use this route to switch
    // the Dropbox account associated with a Blot
    // account. We save this in the session because
    // I couldn't be bothered to add a new callback
    // url. The session is preserved in the next block.
    if (request.query.change_account)
      request.session.change_account = true;

    // Cache the current session so we can
    // link a newly authenticated user to
    // someone who just bought an account.
    for (var i in request.session)
      _session[i] = request.session[i];

    // Get a fresh session ID to use during auth
    request.session.regenerate(function(error){

      if (error) throw error;

      // Replace the old session content
      for (var j in _session)
        request.session[j] = _session[j];

      var client = new Dropbox.Client(config.dropbox),
          sessionID = request.sessionID;

      // Register a new authDriver. We pass the request &
      // response so we can redirect the user to Dropbox.
      client.authDriver(new authDriver(request, response));

      // Start the authentication flow.
      client.authenticate(function(error, client){

        // This function is invoked when the user returns
        // to /auth/callback and so we pass the client
        eventEmitter.emit(clientReady(sessionID), error, client);
      });
    });
  });

  server.get('/folder/authenticated', function (request, response, next) {

    var code = request.query.code;
    var error = request.query.error;

    // I'll probably need to add a specific error handler
    // here for folks who want to change Dropbox account
    // if (error && request.session.change_account) return ...

    if (error) return response.redirect(connectError(error));

    if (!code) return response.redirect('/folder/authenticate');

    var sessionID = request.sessionID;

    // Tell auth driver to try and create an OAuth token
    eventEmitter.emit(backFromDropbox(sessionID), {code: code});

    // Once the auth driver has attempted to create a
    // client this function will be called.
    eventEmitter.once(clientReady(sessionID), function(error, client){

      if (error || !client.isAuthenticated())
        return response.redirect(connectError(error));

      if (request.session.change_account)
        return saveCredentials(request, response, next, client);

      var credentials = client.credentials();

      Blog.getByDropboxUid(credentials.uid, function(err, blogs){

        if (err) return next(err);

        migrateFolder(client, request.blog, blogs, function(err, newFolder){

          if (err) return next(err);

          Blog.set(request.blog.id, {credentials: credentials, folder: newFolder}, function(err){

            if (err) return next(err);

            return response.redirect('/');
          });
        });
      });
    });
  });

  function authDriver (request, response) {

    return {

      authType: function() {return 'code';},

      url: function() {return callbackUrl;},

      doAuthorize: function(authUrl, state, client, callback) {

        var sessionID = request.sessionID;

        // This event is emitted when the user hits /auth/callback
        // and will tell the Dropbox client to proceed with auth
        eventEmitter.once(backFromDropbox(sessionID), callback);

        // Redirect the user to Dropbox.com to click 'authorize'
        response.redirect(authUrl);
      }
    };
  }

  function clientReady (sessionID) {
    return 'clientReady:' + sessionID;
  }

  function backFromDropbox (sessionID) {
    return 'hasReturned:' + sessionID;
  }

  function connectError (message) {
    return '/folder/connect?error=' + encodeURIComponent(message);
  }
};
