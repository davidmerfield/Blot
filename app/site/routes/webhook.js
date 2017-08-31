module.exports = function(server){

  var config = require('../../../config');
  var stripe = require('stripe')(config.stripe.secret);
  var email = require('../../email');
  var User = require('../../models/user');
  var bodyParser = require('body-parser');

  server.post('/stripe-webhook', bodyParser.json(), function (request, response) {

    if (!request.body)  return;

    if (config.maintenance) {
      console.log('Request to stripe webhook under maintenance');
      return response.send('OK!!');
    }

    var stripeEvent = request.body,
        eventBody = stripeEvent.data.object;

    console.log('Stripe: Recieved a webhook for event: ' + stripeEvent.type);

    if (stripeEvent.type === 'invoice.payment_failed') {
      email.FAILED_PAYMENT();
    }

    // A customer's subscription was changed, save changed info
    if (stripeEvent.type === 'customer.subscription.updated'){

      var customerID = eventBody.customer,
          subscriptionID = eventBody.id;

      stripe.customers.retrieveSubscription(customerID, subscriptionID, function(err, latestSubscription) {

        if (err || !latestSubscription) return console.log(err || 'No subscription');

        console.log('Retrieved latest subscription from stripe successfully');

        User.getByCustomerId(customerID, function(err, user){

          if (err) return console.log(err);

          var uid = user.uid;

          User.set(uid, {subscription: latestSubscription}, function(errors){
            if (errors) throw errors;
          });

          if (latestSubscription.status === 'canceled') {

            if (user.isDisabled) {
              email.ALREADY_CANCELLED(uid);
            }

            if (!user.isDisabled) {
              email.CLOSED(uid);
            }
          }

          if (latestSubscription.status === 'past_due') {
            email.OVERDUE(uid);
          }

          if (latestSubscription.status === 'unpaid') {
            email.OVERDUE_CLOSURE(uid);
          }

        });
      });
    }

    return response.sendStatus(200);
  });
};