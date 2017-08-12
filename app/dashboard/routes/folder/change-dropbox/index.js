var config = require('config');
var info = require('./info');
var transfer = require('./transfer');
var sync = require('../../../../sync');
var Dropbox = require('dropbox');

module.exports = function(server){

  server.route('/folder/change-dropbox')

    .get(function(req, res, next){

      console.log('here!');

      // Load the user's Dropbox account info
      // In future we should be saving this in the db...
      info(req, function(err, info){

        if (err) return next(err);

        res.addLocals({dropbox_email: info.email});

        res.title('Change your Dropbox account');
        res.renderDashboard('folder/change-dropbox');
      });
    });

  server.route('/folder/change-dropbox/copy-files')

    .get(function(req, res, next){

      if (!req.session.old_credentials)
        return res.redirect('/folder/change-dropbox');

      info(req, function(err, info, new_client){

        if (err) return next(err);

        var old_client = new Dropbox.Client(config.dropbox);

        old_client.setCredentials(req.session.old_credentials);

        // Remove the old credentials
        // This must happen before res.render
        // or the session will not be saved...
        req.session.old_credentials = null;

        res.addLocals({dropbox_email: info.email});

        res.title('Copy your files');
        res.renderDashboard('folder/copy-files');

        old_client.authenticate(function(err, old_client){

          if (err) console.log(err);

          transfer(old_client, new_client, function(err){

            if (err) console.log(err);

            // Now sync the user's folder
            // to make sure it's in order
            sync(req.user.uid, function(err){

              if (err) console.log(err);

              console.log('Successfully changed the Dropbox account of', req.user.email);
            });
          });
        });
      });
    });
};