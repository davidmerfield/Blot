module.exports = function(server){

  var auth = require('../../authHandler');

  // Customer created, now get access to a
  // folder in their Dropbox. This page tells
  // them what's about to happen.
  server.get('/thanks', auth.enforce, function(request, response){

    response.addLocals({title: 'Thanks!'});

    response.render('thanks');
  });
};