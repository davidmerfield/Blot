var helper = require('helper');
var forEach = helper.forEach;
var localPath = helper.localPath;
var notAllowed = helper.notAllowed;
var rimraf = require('rimraf');
var Blog = require('blog');
var User = require('user');
var emptyS3Folder = require('../../../upload/removeFolder');
var config = require('config');
var stripe = require('stripe')(config.stripe.secret);

module.exports = function (server) {

  server
    .route('/account/delete')

    .get(function(req, res){
      res.title('Delete your account');
      res.renderAccount('delete');
    })

    .post(function(req, res, next){

      forEach.parallel(req.user.blogs, function(blogID, nextBlog){

        Blog.remove(blogID, function(err){

          if (err) console.log(err);

          emptyS3Folder(blogID, function(err){

            if (err) console.log(err);

            var blogDir = localPath(blogID, '/*');

            if (notAllowed(blogDir)) return next();

            rimraf(blogDir, function(err){

              if (err) console.log(err);

              nextBlog();
            });
          });
        });
      }, function(){

        var customerID = req.user.subscription.customer;

        // remember to remove user info from stripe
        // https://stripe.com/docs/api#delete_customer
        stripe.customers.del(customerID, function(err){

          if (err) return next(err);

          User.remove(req.user.uid, function(err){

            if (err) return next(err);

            res.redirect('/deleted');
          });
        });
      });
    });
};