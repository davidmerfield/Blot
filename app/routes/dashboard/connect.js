module.exports = function(server){

  var auth = require('../../authHandler');

  // Customer created, now get access to a
  // folder in their Dropbox. This page tells
  // them what's about to happen.
  server.get('/connect', auth.check, function(request, response){

    // Authenticated users should not see this page
    if (request.user) return response.redirect('/');

    var email = request.session.email,
        isNewUser = !!(email),
        isFreeUser = !!(request.session.isFreeUser);

    response.addLocals({
      title: 'Welcome to Blot!',
      error: request.query.error,
      email: email,
      isNewUser: isNewUser,
      isFreeUser: isFreeUser
    });

    response.render('connect');
  });
};