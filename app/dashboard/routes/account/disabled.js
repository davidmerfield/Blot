module.exports = function (server) {

  server.route('/account/disabled')

    .all(function(req, res, next){

      if (req.user.isDisabled) return next();

      return res.redirect('/');
    })

    .get(function(req, res){
      res.locals.title = 'Your Blot account is disabled';
      res.render('account/disabled');
    })

    .post(function(req, res){

      res.redirect(req.path);
    });

};