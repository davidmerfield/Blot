module.exports = function(server){

  var User = require('user');

  server.route('/account/change-password')

    .get(function(req, res){
      
      if (!req.user.hasPassword)
        return res.redirect('/account/set-password');

      res.locals.subpage_title = 'Password';
      res.locals.subpage_slug = 'change-password';
      res.locals.title = 'Change your password';
      res.render('account/change-password');
    })

    .post(function(req, res, next){

      var uid = req.user.uid;
      var currentPassword = req.body && req.body.currentPassword;
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

      User.checkPassword(uid, currentPassword, function(err, match){

        if (err) return next(err);

        if (!match) {
          res.message({error: 'Your existing password is incorrect.'});
          return res.redirect(req.path);
        }

        User.hashPassword(newPasswordA, function(err, passwordHash){

          if (err) return next(err);

          if (!passwordHash) return next(new Error('Could not hash password'));

          User.set(uid, {passwordHash: passwordHash}, function(err){

            if (err) return next(err);
            res.message({success: 'Changed password successfully!', url: '/account'});
            res.redirect('/account');
          });
        });
      });
    });
};