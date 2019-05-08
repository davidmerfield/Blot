var Blog = require("blog");
var User = require("user");
var config = require("config");
var async = require("async");
var stripe = require("stripe")(config.stripe.secret);
var email = "dmerfield@gmail.com";

var customer = {
  card: "tok_mastercard",
  email: email,
  plan: config.stripe.plan,
  trial_end: Math.round(Date.now() / 1000) + 1000,
  description: "Blot subscription"
};

var user = {};
var blog = { handle: "overdue" };

stripe.customers.create(customer, function(err, customer) {
  if (err) throw err;
  user.subscription = customer.subscription.subscription;

  User.create(email, "XXXX", user, function(err, user) {
    if (err) throw err;
    Blog.create(user.uid, blog, function(err, blog) {
      if (err) throw err;

      stripe.customers.update(customer.id, {
        
        card: "tok_chargeCustomerFail",

      }, function(err){
      if (err) throw err;

        stripe.customers.updateSubscription(customer.id, customer.subscription.id, {
          trial_end: Math.round(Date.now() / 1000) + 3,
          prorate: false
        }, function(err, subscription){
    
          if (err) throw err;

          stripe.invoices.list({ customer: customer.id }, function onList (err, invoices) {
              
            if (err) throw err;

            if (!invoices.length) {
              console.log('No invoices yet, waiting 5s and trying again...');
              return setTimeout(function(){

                stripe.invoices.list({ customer: customer.id }, onList);

              }, 5000);
            }

            console.log(invoices);
            console.log('Found invoices!');      
          });
        });
      });

      // stripe.customers.updateSubscription(
      //   customer.id,
      //   customer.subscription.id,
      //   {
          
      //   },
      //   function(err, subscription) {
      //     if (err) throw err;

      //     console.log(subscription);
      //     console.log('Waiting 10s', new Date(trial_end * 1000));

      //     setTimeout(function(){

      //     console.log('Waited 10s');

      //     //   stripe.invoices.list({ customer: customer.id }, function(err, invoices) {
              
      //     // if (err) throw err;

      //     //     if (!invoices.length) throw new Error('No invoices');

      //     //     async.each(invoices.data, function(invoice, nextInvoice) {
      //     //       if (invoice.paid) return nextInvoice();
      //     //       stripe.invoices.pay(invoice.id, nextInvoice);
      //     //     }, function(err){
      //     //       if (err) console.log('Successful payment error!');
      //     //     });
      //     //   });
      //     }, 10000);
      //   }
      // );
    });
  });
});
