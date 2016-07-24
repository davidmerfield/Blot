module.exports = function(server){

  var config = require('../../../config'),
      email = require('../../email'),
      auth = require('../../authHandler'),
      stripe = require('stripe')(config.stripe.secret),
      User = require('../../models/user');

  var bodyParser = require('body-parser');

  server.get('/restart-subscription', auth.enforce, updateBilling('Restart your subscription', true));

  server.get('/update-billing', auth.enforce, updateBilling('Update payment information'));

  function updateBilling (title, restart) {

    return function updateBilling (request, response) {

      var user = request.user;

      // User doesnt need to pay
      if (user.isFreeForLife)
        return response.redirect('/settings');

      // If user is new or doesn't have a handle,
      // let them choose one
      response.addLocals({
        title: title,
        restart: restart,
        partials: {yield: 'dashboard/update-billing'},
        stripe_key: config.stripe.key
      });

      response.render('dashboard/_wrapper');
    };
  }

  // Takes a stripe token generated
  // on the client and creates a charge
  server.post('/update-billing', auth.enforce, bodyParser.urlencoded({extended:false}), function(request, response){

    var user = request.user,
        uid = user.uid,
        restart = request.query.restart;

    var stripeToken = request.body.stripeToken;

    // User doesnt need to pay
    if (user.isFreeForLife)
      return response.redirect('/settings');

    if (!stripeToken) {
      response.message({error: 'We were unable to verify your new payment information. Please try again'});
      return response.redirect(request.url);
    }

    stripe.customers.updateSubscription(
      user.subscription.customer,
      user.subscription.id,
      {card: stripeToken},
      onUpdate
    );

    function onUpdate (err, subscription) {

      var defaultError = 'We were unabled to add your new payment information, please try again.';

      if (err) {
        response.message({error: err.message || defaultError});
        return response.redirect('/update-billing');
      }

      if (subscription) {

        User.set(uid, {subscription: subscription}, function(errors){

          if (errors) throw errors;

          var success;

          if (restart) {
            email.RESTART(uid);
            success = 'Your subscription was restarted successfully!';
          } else {
            email.UPDATE_BILLING(uid);
            success = 'Your payment information was updated successfully!';
          }

          response.message({success: success, url: '/settings'});
          return response.redirect('/settings');
        });
      }
    }
  });
};