var restrict = require('authHandler').enforce;
var helper = require('helper');
var forEach = helper.forEach;
var User = require('user');
var config = require('config');
var Dropbox = require('dropbox');
var sync = require('../../../../sync');

var TRY_AGAIN = [
  0, 500, 504, // network error
  429, 503 // rate limit error
];

var IGNORE = [
  403 // file already exists
];

function shouldRetry (error) {
  return error && error.status && TRY_AGAIN.indexOf(error.status) !== -1;
}

function shouldIgnore (error) {
  return error && error.status && IGNORE.indexOf(error.status) !== -1;
}

module.exports = function(server){

  function copy (oldClient, newClient, callback) {

    oldClient.readdir('/', function(err, paths){

      if (err) return callback(err);

      forEach.multi(25)(paths, function(path, nextPath){

        oldClient.copyRef(path, function onRef(err, ref){

          // There was a network or rate limit error
          if (shouldRetry(err)) return oldClient.copyRef(path, onRef);

          // Work out what to do with this afterwards
          if (err) {
            console.log(err);
            return nextPath();
          }

          newClient.copy(ref, path, function onCopy (err){

            // There was a network or rate limit error
            if (shouldRetry(err)) return newClient.copy(ref, path, onCopy);

            // The file already exists
            if (shouldIgnore(err)) return nextPath();

            // Eh not sure...
            if (err) console.log(err);

            nextPath();
          });
        });
      }, callback);
    });
  }

  server.route('/account/change-dropbox/copy-files')

    .all(restrict)

    .get(function(req, res, next){

      if (!req.session.old_credentials)
        return res.redirect('/account/change-dropbox');

      // Todo store db name & email so I don't have to fetch
      // this remotely here...
      User.makeClient(req.user.uid, function(err, new_client){

        if (err) return next(err);

        new_client.getAccountInfo(function(err, info){

          if (err) return next(err);

          var old_client = new Dropbox.Client(config.dropbox);

          old_client.setCredentials(req.session.old_credentials);

          // Remove the old credentials
          // This must happen before res.render
          // or the session will not be saved...
          req.session.old_credentials = null;

          res.addLocals({
            partials: {yield: 'dashboard/change-dropbox/copy-files'},
            dropbox_email: info.email,
            dropbox_name: info.name,
            title: 'Copy your files'
          });

          res.render('dashboard/_account_wrapper');

          old_client.authenticate(function(err, old_client){

            if (err) console.log(err);

            copy(old_client, new_client, function(err){

              if (err) console.log(err);

              // Now sync the user's folder
              // to make sure it's in order
              sync(req.user.uid, function(err){

                if (err) console.log(err);

                console.log('Successfully changed the Dropbox account of', req.user.name);
              });
            });
          });
        });
      });
    });
};