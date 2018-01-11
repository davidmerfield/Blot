module.exports = function(server){

  var User = require('user');

  server.route('/account/set-password')

    .get(function(req, res){
      
      if (!req.query.token) return res.redirect('/');

      res.title('Set your password');
      res.locals.token = req.query.token;
      return res.renderAccount('set-password');
    })

    .post(function(req, res, next){

      var uid = req.user.uid;
      var token = req.body && req.body.token;
      var newPasswordA = req.body.newPasswordA;
      var newPasswordB = req.body.newPasswordB;

      if (!newPasswordA) {
        res.message({error: 'Please choose a new password'});
        return res.redirect(req.path);
      }

      if (newPasswordA !== newPasswordB) {
        res.message({error: 'Your new passwords do not match.'});
        return res.redirect(req.path);
      }

      User.checkAccessToken(token, function(err, tokenUid){

        if (err) return next(err);

        if (tokenUid !== uid) {
          res.message({error: 'Your token was invalid.'});
          return res.redirect(req.path);
        }

        User.hashPassword(newPasswordA, function(err, passwordHash){

          if (err) return next(err);

          if (!passwordHash) return next(new Error('Could not hash password'));

          User.set(uid, {passwordHash: passwordHash}, function(err){

            if (err) return next(err);
            res.message({success: 'Your password is now set!', url: '/'});
            res.redirect('/');
          });
        });
      });
    });
};
