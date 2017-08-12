module.exports = function(server){

  var crypto = require('crypto'),
      config = require('../../../config'),
      secret = config.dropbox.secret,

      stripe = require('stripe')(config.stripe.secret),
      email = require('../../email'),
      User = require('../../models/user');

  var Blog = require('blog');
  var bodyParser = require('body-parser');
  var helper = require('../../helper');
  var forEach = helper.forEach.parallel;

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

  var SIGNATURE = 'x-dropbox-signature';
  var sha = crypto.createHmac.bind(this, 'SHA256');
  var sync = require('../../sync');

  server.route('/webhook')

    .get(function(req, res, next) {

      if (req.query && req.query.challenge)
        return res.send(req.query.challenge);

      return next();
    })

    .post(function(req, res) {

      if (config.maintenance)
        return res.status(503).send('Under maintenance');

      console.log(new Date(), 'Webhook recieved.');

      var data = '';
      var users = [];
      var signature = req.headers[SIGNATURE];
      var verification = sha(secret);

      req.setEncoding('utf8');

      req.on('data', function(chunk){
        data += chunk;
        verification.update(chunk);
      });

      req.on('end', function() {

        console.log(new Date(), 'Webhook parsed...');

        if (signature !== verification.digest('hex'))
          return res.send(403);

        try {
          users = JSON.parse(data).delta.users;
        } catch (e) {
          return res.status(504).send('Bad delta');
        }

        console.log(new Date(), '... Users parsed successfully!');

        // Tell dropbox it worked!
        res.send('OK');

        // Sync each of the UIDs!
        forEach(users, function(uid, nextUser){

          // cast uid to string
          uid = uid + '';

          console.log(new Date(), '... starting sync for', uid);

          Blog.getByDropboxUid(uid, function(err, blogs){

            forEach(blogs, function(blog, nextBlog){

              sync(blog.id);
              nextBlog();

            }, nextUser);
          });
        }, function(){

          console.log(new Date(), '... started sync for each user!');
        });
      });
    });
};