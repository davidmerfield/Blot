module.exports = function(server){

  var auth = require('authHandler');
  var User = require('user');
  var csrf = require('csurf');

  server.get('/swap', auth.enforce, csrf(), function(request, response, next){

    // Render the static homepage later...
    if (!request.user ||
        !request.query ||
        !request.query.to) return next();

    var user = request.user;
    var uid = user.uid;
    var to = request.query.to;

    // Verify the user owns the blog
    if (user.blogs.indexOf(to) > -1) {
      User.set(uid, {lastSession: to}, function(){});
      request.session.blogID = to;
    }

    response.redirect('/');
  });
};