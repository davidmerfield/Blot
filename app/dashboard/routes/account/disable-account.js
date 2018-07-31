module.exports = function(server){

  var User = require('user');
  var Blog = require('blog');
  var forEach = require('helper').forEach;
  var email = require('email');

  server.route('/account/disable-account')

    // Make sure users with a subscription ask them
    // to disable their subscription first
    .all(function(req, res, next){

      if (req.user.isSubscribed)
        return res.redirect('/account/cancel');

      return next();
    })

    .get(function(req, res){
      res.locals.title = 'Disable your account';
      res.locals.subpage_title = 'Disable your account';
      res.locals.subpage_slug = 'disable';

      res.render('account/disable');
    })

    .post(function(req, res, next){

      if (!req.body.disableAccount) return res.redirect('/account');

      User.set(req.user.uid, {isDisabled: true}, function(errors){

        if (errors) return next(errors);

        forEach(req.user.blogs, function(blogID, nextBlog){

          Blog.set(blogID, {isDisabled: true}, nextBlog);

        }, function(){

          email.DISABLED(req.user.uid);

          res.redirect('/account/disabled');
        });
      });
    });
};