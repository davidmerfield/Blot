var formJSON = require('helper').formJSON;
var User = require('user');

module.exports = function (server) {


  require('./change-dropbox')(server);
  require('./close-blog')(server);
  require('./create-blog')(server);
  require('./cancel')(server);
  require('./delete')(server);
  require('./disable-account')(server);
  require('./disabled')(server);
  require('./enable')(server);
  require('./export')(server);
  require('./logout')(server);
  require('./pay-subscription')(server);
  require('./swap')(server);
  require('./update-billing')(server);

  server.route('/account')

    .get(function(req, res) {
      res.title('Account');
      res.renderAccount('index');
    })

    .post(function(req, res){

      var updates = formJSON(req.body, User.model);

      User.set(req.user.uid, updates, function(errors, changes){

        if (errors)
          res.message({errors: errors});

        if (changes.length && !errors)
          res.message({success: 'Made changes successfully!'});

        res.redirect(req.path);
      });
    });
};