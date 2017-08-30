var Blog = require('blog');

module.exports = function (token, new_account_id, req, res, next) {

  var old_account_id = req.blog.credentials.account_id;
  var blogID = req.blog.id;

  console.log('OLD DROPBOX UID', old_account_id);
  console.log('NEW DROPBOX UID', new_account_id);

  // If the user has logged in again to the same
  // Dropbox account then don't bother with this BS
  if (old_account_id === new_account_id) {

    console.log('HERE! for same account id');

    req.session.message = {
      url: '/folder/change-dropbox',
      warning: 'Your blog was already connected to that Dropbox account.'
    };

    return res.redirect('/folder/change-dropbox');
  }

  Blog.getByDropboxAccountId(new_account_id, function(err, blogs){

    if (err) return next(err);

    if (blogs.length) {

      // req.session.message = {
      //   url: '/account/change-dropbox',
      //   warning: 'That Dropbox account is already connected to a different Blot account and cannot be connected to this Blot account.'
      // };

      // console.log('HERE!');

      // return res.redirect('/folder/change-dropbox');
    }

    // Save the old credentials in the session temporarily
    // so we can copy the files from the old acount in future
    req.session.old_credentials = req.blog.credentials;

    var updates = {dropbox: req.blog.dropbox};

    updates.dropbox.id = new_account_id;
    updates.dropbox.token = token;
    updates.dropbox.cursor = '';

    Blog.set(blogID, updates, function(err){

      if (err) return next(err);

      res.redirect('/folder/change-dropbox/copy-files');
    });
  });
};