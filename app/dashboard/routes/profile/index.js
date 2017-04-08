var Blog = require('blog');
var helper = require('helper');
var _ = require('lodash');
var extend = helper.extend;
var form = require('./form');
var uploadAvatar = require('./uploadAvatar');
var type = helper.type;
var SUCCESS = 'Made changes successfully!';

module.exports = function(server){

  server.route('/profile')

    .get(function(req, res){

      for (var i in res.locals.blog.menu) {
        res.locals.blog.menu[i].index = i;
      }

      res.title('Your profile');
      res.renderDashboard('profile');
    })

    .post(form, uploadAvatar, function(req, res, next){

      var blog = req.blog;
      var blogID = blog.id;
      var updates = req.body || {};

      updates.menu = updates.menu || [];

      for (var i in updates.menu) {

        for (var x in blog.menu) {

          if (blog.menu[x].id === updates.menu[i].id) {

            extend(updates.menu[i])
              .and(blog.menu[x]);
          }
        }
      }

      // Oterwhse the menu is deleted...
      if (!updates.menu.length) {
        delete updates.menu;
      }

      Blog.set(blogID, updates, function(errors, changes){

        if (errors) return next(errors);

        // Add success message if we're going to the settings page
        // and successful changes were made
        if (changes && changes.length && _.isEmpty(errors)) {
          res.message({success: SUCCESS});
        }

        return res.redirect(req.path);
      });
    })

    // I don't know how to handle uncaught errors
    // WIll that cause an infinite redirect?
    .all(function(err, req, res, next){

      var message = {};

      // this should not be an object but I made
      // some bad decisions in the past. eventually
      // fix blog.set...
      if (type(err, 'object')) {
        message.errors = err;
      } else if (err.message) {
        message.error = err.message;
      } else {
        return next(err);
      }

      res.message(message);
      res.redirect(req.path);
    });
};