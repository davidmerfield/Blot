var config = require('config');
var Blog = require('blog');
var User = require('user');
var forEach = require('helper').forEach;
var stripe = require('stripe')(config.stripe.secret);
var email = require('email');

module.exports = function(server){

  var ROUTE = '/account/cancel';
  var TITLE = 'Cancel your subscription';

  var ERROR = 'We were unabled to cancel your subscription, please try again.';
  var SUCCESS = 'Your Blot subscription was cancelled. You will not be billed by Blot again.';

  server

    .route(ROUTE)

    .all(function(req, res, next){

      // Make sure the user has a subscription
      // otherwise they have nothing to cancel
      if (req.user.isSubscribed) return next();

      return res.redirect('/account/restart');
    })

    .get(function(req, res){
      res.title(TITLE);
      res.locals.subpage_title = TITLE;
      res.locals.subpage_slug = 'cancel';

      res.renderAccount('cancel');
     })

    .post(function(req, res){

      var user = req.user;
      var uid = user.uid;

      stripe.customers.cancelSubscription(
        user.subscription.customer,
        user.subscription.id,
        {at_period_end: true},
        function(err, subscription) {

          var isDisabled = !!(req.body.disableAccount);

          if (err) {
            res.message({error: err.message || ERROR, url: ROUTE});
            return res.redirect(req.path);
          }

          if (!subscription) {
            res.message({error: ERROR, url: ROUTE});
            return res.redirect(req.path);
          }

          var changes = {
            subscription: subscription,
            isDisabled: isDisabled
          };

          User.set(uid, changes, function(errors){

            if (errors) throw errors;

            forEach(user.blogs, function(blogID, nextBlog){

              Blog.set(blogID, {isDisabled: isDisabled}, nextBlog);

            }, function(){

              var andDisabled = isDisabled ? ' and disabled your account' : '';

              email.CANCELLED(uid, {andDisabled: andDisabled});

              if (isDisabled) {
                return req.session.destroy(function(){
                  res.redirect('/disabled');
                });
              }

              res.message({success: SUCCESS, url: '/account'});
              res.redirect('/account');
            });
          });
        }
      );
    });
};