module.exports = function(server){

  var config = require('../../../config'),
      forEach = require('../../helper').forEach,
      stripe = require('stripe')(config.stripe.secret),
      auth = require('../../authHandler'),
      email = require('../../email'),
      Blog = require('../../models/blog'),
      User = require('../../models/user'),
      bodyParser = require('body-parser');

  server.get('/cancel', auth.enforce, function (request, response){

    var user = request.user;

    // User doesnt have a subscription
    if (!user.isSubscribed)
      return response.redirect('/settings');

    response.addLocals({
      partials: {yield: 'dashboard/cancel'},
      title: 'Cancel subscription'
    });

    response.render('dashboard/_wrapper');
  });

  // Takes a stripe token generated
  // on the client and creates a charge
  server.post('/cancel', auth.enforce, bodyParser.urlencoded({extended:false}), function(request, response){

    var user = request.user,
        uid = user.uid;

    // User doesnt have a subscription
    if (!user.isSubscribed) return response.redirect('/settings');

    stripe.customers.cancelSubscription(
      user.subscription.customer,
      user.subscription.id,
      {at_period_end: true},
      onCancel
    );

    function onCancel (err, subscription) {

      var defaultError = 'We were unabled to cancel your subscription, please try again.',
          isDisabled = !!(request.body.disableAccount),
          andDisabled = isDisabled ? ' and disabled your account' : '';

      if (err) {
        response.message({error: err.message || defaultError, url: '/cancel'});
        return response.redirect('/cancel');
      }

      if (subscription) {

        User.set(uid, {subscription: subscription, isDisabled: isDisabled}, function(errors){

          if (errors) throw errors;

          forEach(user.blogs, function(blogID, nextBlog){

            Blog.set(blogID, {isDisabled: isDisabled}, nextBlog);

          }, function(){

            email.CANCELLED(uid, {andDisabled: andDisabled});

            if (isDisabled) {
              return request.session.destroy(function(){
                response.redirect('/disabled');
              });
            }

            var successMessage = 'Your Blot subscription was cancelled. You will not be billed by Blot again.';

            response.message({success: successMessage, url: '/settings'});
            response.redirect('/settings');

          });
        });
      }
    }
  });
};