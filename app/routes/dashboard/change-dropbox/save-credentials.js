var helper = require('helper');
var forEach = helper.forEach;
var Blog = require('../../../models/blog');
var User = require('../../../models/user');
var redis = require('../../../models/client');

module.exports = function (req, res, next, client) {

  var old_uid = req.session.uid;
  var new_uid = client.dropboxUid();

  // If the user has logged in again to the same
  // Dropbox account then don't bother with this BS
  if (old_uid === new_uid) {

    req.session.message = {
      url: '/account/change-dropbox',
      warning: 'You had already connected this Dropbox account to Blot. Please log into the Dropbox account you\'d like to use.'
    };

    return res.redirect('/account/change-dropbox');
  }

  User.getBy({uid: new_uid}, function(err, user){

    if (err) return next(err);

    // We already have a user with this UID!
    // We can't have two users with the same UID
    // so leave here...
    if (user) {

      req.session.message = {
        url: '/account/change-dropbox',
        warning: 'That Dropbox account is already connected to a different Blot account and cannot be connected to this Blot account.'
      };

      return res.redirect('/account/change-dropbox');
    }

    User.getCredentials(old_uid, function(err, old_credentials){

      if (err || !old_credentials) return next(err || new Error('No credentials'));

      // Save the old credentials in the session temporarily
      // so we can copy the files from the old acount in future
      req.session.old_credentials = old_credentials;

      User.getBy({uid: old_uid}, function(err, user){

        if (err || !user) return next(err || new Error('No user'));

        var customer_id = user.subscription.customer;

        var changes = {
          credentials: client.credentials(),
          uid: new_uid
        };

        forEach(user.blogs, function(blogID, nextBlog){

          Blog.set(blogID, {owner: new_uid}, function(err){

            if (err) return next(err);

            nextBlog();
          });

        }, function(){

          User.set(old_uid, changes, function(err){

            if (err) return next(err);

            var multi = redis.multi();

            multi.set("customer:" + customer_id, new_uid);
            multi.rename("user:" + old_uid + ":info", "user:" + new_uid + ":info");

            multi.exec(function(err){

              if (err) return next(err);

              req.session.uid = new_uid;

              res.redirect('/account/change-dropbox/copy-files');
            });
          });
        });
      });
    });
  });
};