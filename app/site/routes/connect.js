module.exports = function(server){

  var excludeUser = require('middleware').excludeUser;

  // Customer created, now get access to a
  // folder in their Dropbox. This page tells
  // them what's about to happen.
  server.get('/connect', excludeUser, function(req, res){

    res.addLocals({
      title: 'Welcome to Blot!',
      error: req.query.error,
      email: req.session.email,
      newUser: req.session.newUser,
      freeUser: req.session.freeUser
    });

    res.render('connect');
  });
};