module.exports = function(server){

  var bodyParser = require('body-parser');
  var Subscription = require('subscription');
  var config = require('config');
  var stripe = require('stripe')(config.stripe.secret);
  var parseBody = bodyParser.urlencoded({extended:false});
  var csrf = require('csurf');
  var auth = require('authHandler');

  // Stripe Errors
  var BAD_CHARGE = 'We were unable to charge your card. Please fill out the form and try again, it should work.';
  var NO_EMAIL = 'Please enter an email address';
  var DECLINED = 'Your card was declined, please try again.';
  var DECLINED_CODE = 'StripeCardError';

  var TITLE = 'Sign up for Blot and start your blog';

  if (config.maintenance) {

    server.use('/sign-up', function(req, res, next){

      res.redirect('/maintenance');
    });
  }

  server.route('/sign-up')

    // Authenticated users should not
    // see this page. It is served over SSL
    .all(auth.exclude)

    .get(csrf(), function(req, res){

      res.render('public/sign-up', {
        title: TITLE,
        error: req.query.error,
        stripe_key: config.stripe.key,
        csrftoken: req.csrfToken()
      });
    })

    // Take a stripe token generated
    // on the client and creates a charge
    .post(parseBody, function(request, response, next){

      var stripeToken = request.body.stripeToken;
      var email = request.body.email;

      if (!stripeToken)
        return next(new Error(BAD_CHARGE));

      if (!email)
        return next(new Error(NO_EMAIL));

      var info = {
        card: stripeToken,
        email: email,
        plan: 'yearly_20',
        description: 'Blot subscription for $20 a year'
      };

      stripe.customers.create(info, function (error, customer) {

        if (error && error.type === DECLINED_CODE) {
          return next(new Error(DECLINED));
        }

        if (error) {
          return next(new Error(BAD_CHARGE));
        }

        if (customer) {

          // Store the user's email and charge ID
          // so that when the user returns from
          // Dropbox we know they have a blot account
          request.session.email = email;
          request.session.subscription = customer.subscription;

          // Store the new customer's information
          Subscription.save(customer.subscription, function(error){

            if (error) throw error;

            console.log('Customer: ' + customer.subscription.customer + ' charged successfuly for ' + email);

            response.redirect('/connect');
          });
        }
      });
    });

  // This is error handling middleware
  // specific to the sign up page
  server.use('/sign-up', function (error, req, res, next){
    res.redirect('/sign-up?error=' + encodeURIComponent(error.message));
  })
};

