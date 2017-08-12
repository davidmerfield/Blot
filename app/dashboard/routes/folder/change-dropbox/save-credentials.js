var Blog = require('blog');

module.exports = function (req, res, next, client) {

  var old_uid = req.blog.credentials.uid;
  var new_uid = client.dropboxUid();
  var blogID = req.blog.id;

  console.log('OLD DROPBOX UID', old_uid);
  console.log('NEW DROPBOX UID', new_uid);

  // If the user has logged in again to the same
  // Dropbox account then don't bother with this BS
  if (old_uid === new_uid) {

    console.log('HERE! for same uid');

    req.session.message = {
      url: '/folder/change-dropbox',
      warning: 'Your blog was already connected to that Dropbox account.'
    };

    return res.redirect('/folder/change-dropbox');
  }

  Blog.getByDropboxUid(new_uid, function(err, blogs){

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

    Blog.set(blogID, {credentials: client.credentials()}, function(err){

      if (err) return next(err);

      res.redirect('/folder/change-dropbox/copy-files');
    });
  });
};