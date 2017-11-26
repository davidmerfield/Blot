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
var clients = require('clients');

module.exports = function (server) {

  function removeBlog (blogID, nextBlog){

    Blog.get({id: blogID}, function(err, blog){

      if (err) console.log(err);

      var remove_client = blog.client ?
         clients[blog.client].disconnect :
         function (x,y) {y();};

      remove_client(blogID, function(err){

        if (err) console.log(err);

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
      });
    });
  }

  server
    .route('/account/delete')

    .get(function(req, res){
      res.title('Delete your account');
      res.renderAccount('delete');
    })

    .post(function(req, res, next){

        forEach.parallel(req.user.blogs, removeBlog, function(){

          var customerID = req.user.subscription.customer;

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