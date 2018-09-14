var Express = require("express");
var PaySubscription = new Express.Router();


  var config = require('config');
  var stripe = require('stripe')(config.stripe.secret);
  var User = require('user');

  function loadInvoices (customerID) {
    
    stripe.invoices.list({customer: customerID}, function (err, invoices) {

      var invoiceID, error;
    
      unpaid_invoices = [];

      if (invoices.data[0].paid) {
      }

      next();
    });
  }

  function updateSubscription () {
    
    stripe.customers.retrieveSubscription(
      user.subscription.customer,
      user.subscription.id,
      function(err, subscription) {

        if (err) throw err;

        if (subscription) {
          User.set(uid, {subscription: subscription}, function(errors){

            if (errors) throw errors;

            response.redirect('/');
          });
        }
      }
    );

  }

  PaySubscription.route('/')

    .get(function (req, res) {

      if (!user.isUnpaid && !user.isPastDue) {
        return next(new Error('You have paid your dues'));
      }

      next();
    })

    .get(loadInvoices)

      var customerID = user.subscription.customer;

      

          return 
        }

        try {
          invoiceID = invoices.data[0].id;
        } catch (e) {
          error = 'Could not load your invoice, please refresh the page';
        }

        // If user is new or doesn't have a handle,
        // let them choose one
        response.render('account/pay-subscription', {
          stripe_key: config.stripe.key,
          invoiceID: invoiceID
        });
      });
    })

    // Takes a stripe token generated
    // on the client and creates a charge
    .post(function(request, response){

      var user = request.user,
          uid = user.uid;

      if (!user.isUnpaid && !user.isPastDue) return response.send('Your account is in good standing');

      var stripeToken = request.query.stripeToken,
          invoiceID = request.query.invoiceID;

      if (!stripeToken) {
        console.log('No stripe token passed');
        return response.send('We were unable to verify your new payment information. Please try again');
      }

      if (!invoiceID) {
        console.log('No invoice ID passed');
        return response.send('We were unable to load your unpaid invoice. Please refresh the page.');
      }

      var customerID = user.subscription.customer,
          subscriptionID = user.subscription.id;

      console.log('Settling invoice now.... ' + subscriptionID);
      stripe.customers.update(customerID, {card: stripeToken}, function(err, customer) {

        if (err) return response.send(err.message || 'Could not process your card, please try again.');
        console.log('Updated payment info');

        if (customer.subscription.status === 'active') {
          console.log('Customer is already in good standing');
          return onComplete();
        }

        stripe.invoices.pay(invoiceID, function(err, invoice) {

          // Dangerous, stripe message might change
          if (err && err.message !== 'Invoice is already paid') {
            console.log(err);
            console.log(invoice);
            return response.send(err.message || 'Could not pay your invoice, please try again.');
          }

          onComplete();
        });

        function onComplete() {
          response.send('SUCCESS');

          user.subscription.status = 'active';
          User.set(uid, {subscription: user.subscription}, function(errors){
            if (errors) throw errors;
          });

          stripe.customers.retrieveSubscription(
            user.subscription.customer,
            user.subscription.id,
            function(err, subscription) {

              if (err) console.log(err);

              if (subscription) {
                console.log('Setting latest subscript from stripe');
                User.set(uid, {subscription: subscription}, function(errors){
                  if (errors) throw errors;
                });
              }
            }
          );
        }
      });
    });
};