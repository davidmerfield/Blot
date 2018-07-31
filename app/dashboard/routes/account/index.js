var formJSON = require('helper').formJSON;
var User = require('user');

module.exports = function (server) {

  require('./password/change')(server);
  require('./password/set')(server);
  require('./close-blog')(server);
  require('./create-blog')(server);
  require('./cancel')(server);
  require('./delete')(server);
  require('./disable-account')(server);
  require('./disabled')(server);
  require('./enable')(server);
  require('./restart')(server);
  require('./export')(server);
  require('./log-out')(server);
  require('./pay-subscription')(server);
  require('./swap')(server);
  require('./update-billing')(server);

  server.route('/account/email')
  .get(function(req, res){
      res.locals.title = 'Change your email';
      res.render('account/email');
  })
  .post(function(req, res){

      var updates = formJSON(req.body, User.model);

      User.set(req.user.uid, updates, function(error, changes){

        console.log(changes);
        
        if (error) {
          res.message({error: error.message});
          return res.redirect('/account/email')
        } else if (changes && changes.length) {
          res.message({success: 'Made changes successfully!', url: '/account'});
        }
        
        res.redirect('/account');
      });
    });

  server.route('/account')

    .get(function(req, res) {
      res.locals.title = 'Account';
      res.render('account/index');
    })

    
};