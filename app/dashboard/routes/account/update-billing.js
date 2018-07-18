module.exports = function(server){

  var config = require('config');
  var email = require('email');
  var stripe = require('stripe')(config.stripe.secret);
  var User = require('user');

  server.route('/account/update-billing')

    .all(function(req, res, next){

      // User doesnt need to pay
      if (req.user.isFreeForLife)
        return res.redirect('/account');

      return next();
    })

    .get(function(req, res) {

      var title = 'Edit payment information';

      // If user is new or doesn't have a handle,
      // let them choose one
      res.addLocals({
        stripe_key: config.stripe.key
      });

      res.title(title);
      res.renderAccount('update-billing');
    })

    // Takes a stripe token generated
    // on the client and creates a charge
    .post(function(request, response){

      var user = request.user;
      var uid = user.uid;

      var restart = request.path === '/account/restart-subscription';
      var stripeToken = request.body.stripeToken;

      if (!stripeToken) {
        response.message({error: 'We were unable to verify your new payment information. Please try again'});
        return response.redirect(request.url);
      }

      stripe.customers.updateSubscription(
        user.subscription.customer,
        user.subscription.id,
        {card: stripeToken, quantity: user.subscription.quantity},
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

              email.UPDATE_BILLING(uid);
              success = 'Your payment information was updated successfully!';

            response.message({success: success, url: '/account'});
            return response.redirect('/account');
          });
        }
      }
  });
};