var User = require('user');
var Csurf = require('csurf');

module.exports = function (req, res, next) {

  if (!req.session || !req.session.uid) return next();

  var uid = req.session.uid;

  User.getBy({uid: uid}, function(err, user){

    if (err) return next(err);

    if (!user) {
      req.user = null;
      req.session.uid = null;
      return next();
    }

    // Lets append the user and
    // set the partials to 'logged in mode'
    req.user = user;
    res.addLocals({user: user});

    Csurf()(req, res, function(err){

      if (err) return next(err);

      // Load the CSRF protection since we're
      // inside the app,
      res.addLocals({
        csrftoken: req.csrfToken()
      });

      return next();
    });
  });
};