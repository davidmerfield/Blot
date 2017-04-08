module.exports = function(server){

  var User = require('user');
  var Blog = require('blog');
  var forEach = require('helper').forEach;

  server.route('/account/enable')

    // Make sure users are actually disabled...
    .all(function(req, res, next){

      if (req.user.isDisabled) return next();

      return res.redirect('/account');
    })

    .get(function(req, res){
      res.title('Enable your account');
      res.renderAccount('enable');
    })

    .post(function(req, res, next){

      if (!req.body.enable) return res.redirect('/account');

      User.set(req.user.uid, {isDisabled: false}, function(errors){

        if (errors) return next(errors);

        forEach(req.user.blogs, function(blogID, nextBlog){

          Blog.set(blogID, {isDisabled: false}, nextBlog);

        }, function(){

          res.redirect('/account');
        });
      });
    });
};