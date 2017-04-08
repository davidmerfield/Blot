module.exports = function(server){

  var User = require('user');

  server.get('/account/swap', function(request, response, next){

    if (!request.query || !request.query.to) return next();

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