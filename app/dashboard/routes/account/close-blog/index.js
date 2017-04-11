var Blog = require('blog');
var loadBlogToClose = require('./loadBlogToClose');
var calculateSubscriptionChange = require('./calculateSubscriptionChange');
var updateSubscription = require('./updateSubscription');
var updateUser = require('./updateUser');
var emptyS3Folder = require('./emptyS3Folder');
var emptyLocalFolder = require('./emptyLocalFolder');

module.exports = function(server){

  server.route('/account/close-blog/:handle')

    // Verify the blog to be closed is owned
    // by the current user and load it into locals.
    .all(loadBlogToClose)

    // Work out how much we need to change the subscription
    // by after the blog has been deleted.
    .all(calculateSubscriptionChange)

    .get(function(req, res){
      res.title('Close ' + req.blogToClose.title);
      res.renderAccount('close-blog');
    })

    // Save any changes to the user's subscription
    // then remove the blogID from the list of blogs
    // owned by the user.
    .post(updateSubscription, updateUser)

    // Finally delete contents of the blog's folder on s3
    // which contains cached images/avatars. Also delete
    // the contents blog's folder on the server.
    .post(emptyS3Folder, emptyLocalFolder)

    // Finally delete the blog's info from the DB
    .post(function(req, res, next){

      Blog.remove(req.blogToClose.id, function(err){

        if (err) return next(err);

        res.redirect('/account');
      });
    })

    .all(function(err, req, res, next){

      return next(err);
    });
};