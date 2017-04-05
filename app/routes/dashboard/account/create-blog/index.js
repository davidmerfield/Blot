var restrict = require('authHandler').enforce;
var parseBody = require('body-parser').urlencoded({extended:false});
var Blog = require('blog');
// We pass an empty string to handle validator
// since we don't know the ID of the blog yet
var validate = require('../../../../models/blog/validate/handle').bind(this, '');
var calculate = require('./calculate');
var charge = require('./charge');
var firstPost = require('./firstPost');
var migrateFolder = require('./migrateFolder');
var helper = require('helper');
var pretty = helper.prettyPrice;
var badSubscription = require('./badSubscription');
var config = require('config');
var SyncLease = require('../../../../sync/lease');
var INACTIVE = 'You need an active subscription to create another blog. ' +
               'Please <a href="/logout?redirect=/sign-up">sign up</a> to start a subscription. ' +
               'Your blog will be preserved.';

module.exports = function(server){

  server.route('/create-blog')

    .all(restrict)

    .get(function(req, res){

      var user = req.user;
      var subscription = user.subscription;

      var fee = calculate(subscription);

      if (user.blogs.length && badSubscription(subscription) && user.uid !== config.admin.uid) {
        res.addLocals({error: INACTIVE});
      }

      res.addLocals({
        title: 'Create your blog',
        now: pretty(fee.now),
        later: pretty(fee.later),
        individual: pretty(fee.individual)
      });

      res.render('create-blog');
    })

    .post(parseBody, function(req, res, next){

      var user = req.user;
      var uid = user.uid;

      validate(req.body.handle, function(err, handle){

        if (err) return next(err);

        var newBlog = {
          handle: handle,
          timeZone: req.body.timeZone
        };

        charge(user, function(err){

          if (err) return next(err);

          Blog.create(uid, newBlog, function(err, newBlog){

            if (err) return next(err);

            // Attempt to pause the syncing for this user
            // by requesting a sync token and holding it until
            // we have migrated the folder. Todo In future, I should
            // add a foolproof way to wait until any existing
            // syncs have finished and prevent any future syncs from
            // happening before the folder migration has finished.
            // This will be useful for the remove blog feature...
            SyncLease.request(uid, function(){

              migrateFolder(user, newBlog, function(err){

                // We release the sync token before
                // handling any folder migration errors
                // to ensure the user's blog continues to sync
                SyncLease.release(uid, function(){

                  if (err) return next(err);

                  firstPost(uid, newBlog, function(err){

                    if (err) return next(err);

                    // Switch to the new blog
                    req.session.blogID = newBlog.id;
                    return res.redirect('/');
                  });
                });
              });
            });
          });
        });
      });
    })

    // Handle errors..
    .all(function(err, req, res, next){

      var message;

      try {

        console.log(err);

        if (err.trace) console.log(err.trace);
        if (err.stack) console.log(err.stack);

        if (err.message) {
          message = err.message;
        } else {
          message = err;
        }

        res.message({error: message});
        res.redirect(req.route.path);

      } catch (e) {

        return next(e);
      }
    });
};