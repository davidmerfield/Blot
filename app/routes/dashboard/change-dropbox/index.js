var restrict = require('../../../authHandler').enforce;
var User = require('../../../models/user');
var messenger = require('../../messenger');

module.exports = function(server){

  // Load route to copy files to new account
  require('./copy-files')(server);

  server.route('/account/change-dropbox')

    .all(restrict)

    .get(messenger, function(req, res, next){

      // Todo store the db name & email so we don't have to
      // fetch this for every page load...
      User.makeClient(req.user.uid, function(err, client){

        if (err) return next(err);

        client.getAccountInfo(function(err, info){

          if (err) return next(err);

          res.addLocals({
            partials: {yield: 'dashboard/change-dropbox/index'},
            title: 'Change your Dropbox account ',
            dropbox_email: info.email,
            dropbox_name: info.name
          });

          res.render('dashboard/_wrapper');
        });
      });
    });
};