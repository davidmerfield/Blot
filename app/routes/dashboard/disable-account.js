module.exports = function(server){

  var email = require('../../email'),
      forEach = require('../../helper').forEach,
      auth = require('../../authHandler'),
      Blog = require('../../models/blog'),
      User = require('../../models/user'),
      bodyParser = require('body-parser');

  server.get('/disabled', auth.check, function(request, response){

    // Only disabled users can see this page
    if (request.user) return response.redirect('/');

    response.addLocals({
      partials: {yield: 'dashboard/disabled'},
      title: 'Your Blot account is disabled',
      noRobots: true
    });

    response.render('dashboard/_wrapper');
  });

  server.get('/disable-account', auth.enforce, function(request, response){

    var user = request.user;

    // Make sure users with a subscription ask them
    // to disable their subscription first
    if (user.isSubscribed) return response.redirect('/cancel');

    // If user is new or doesn't have a handle,
    // let them choose one
    response.addLocals({
      partials: {yield: 'dashboard/disable'},
      title: 'Disable your account'
    });

    response.render('dashboard/_wrapper');
  });

  // Takes a stripe token generated
  // on the client and creates a charge
  server.post('/disable-account', auth.enforce, bodyParser.urlencoded({extended:false}), function(request, response){

    var user = request.user,
        uid = user.uid;

    // Make sure users with a subscription
    // disable their subscription first
    if (user.isSubscribed) return response.redirect('/cancel');

    var shouldDisable = !!(request.body.disableAccount);

    if (!shouldDisable) return response.redirect('/settings');

    User.set(uid, {isDisabled: shouldDisable}, function(errors){

      if (errors) throw errors;

      forEach(user.blogs, function(blogID, nextBlog){

        Blog.set(blogID, {isDisabled: shouldDisable}, nextBlog);

      }, function(){

        email.DISABLED(uid);

        request.session.destroy(function() {
          response.redirect('/disabled');
        });
      });
    });
  });
};