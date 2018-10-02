var database = require("../database");
var async = require("async");

function check_app_folder(blog_id, account_id, callback) {
  var no_blogs_in_app_folder = true;
  var existing_blog_using_app_folder = null;

  database.listBlogs(account_id, function(err, blogs) {
    if (err) return callback(err);

    async.each(
      blogs,
      function(blog, next) {
        // This blog was already connected to this
        // account. It's possible the user is reauthenticating
        // to refresh an expired or revoked token, or switching
        // from partial access permissions to full folder permissions.
        if (blog.id === blog_id) return next();

        database.get(blog.id, function(err, account) {
          if (err) return next(err);

          // If the Dropbox account for this other blog does not
          // have full folder permission then it must neccessarily
          // be inside the app folder. Now we can trip this flag:
          if (!account.full_access) no_blogs_in_app_folder = false;

          // If the Dropbox account for this other blog does not
          // have full folder permission and its folder is an empty
          // string (meaning it is the root of the app folder) then
          // there is an existing blog using the entire app folder.
          if (account.folder === "" && !account.full_access)
            existing_blog_using_app_folder = blog;

          next();
        });
      },
      function(err) {
        callback(err, no_blogs_in_app_folder, existing_blog_using_app_folder);
      }
    );
  });
}

module.exports = check_app_folder;
