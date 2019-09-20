var database = require("../database");
var async = require("async");

module.exports = function(req, res, next) {
  // If we have access to the entire Dropbox folder
  // just create a new folder for this site in the
  // root directory of the user's dropbox, then
  // tell them they can move it wherever they like.
  if (req.unsavedAccount.full_access) return next();

  database.listBlogs(req.unsavedAccount.account_id, function(err, blogs) {
    if (err) return next(err);

    async.each(
      blogs,
      function(blog, next) {
        // This blog was already connected to this
        // account. It's possible the user is reauthenticating
        // to refresh an expired or revoked token, or switching
        // from partial access permissions to full folder permissions.
        if (blog.id === req.blog.id) return next();

        database.get(blog.id, function(err, account) {
          if (err) return next(err);

          // We need to store both of these properties
          if (!account.full_access) req.otherBlogsUseAppFolder = true;

          // If the Dropbox account for this other blog does not
          // have full folder permission and its folder is an empty
          // string (meaning it is the root of the app folder) then
          // there is an existing blog using the entire app folder.
          if (account.folder === "" && !account.full_access)
            req.otherBlogUsingEntireAppFolder = blog;

          next();
        });
      },
      next
    );
  });
};
