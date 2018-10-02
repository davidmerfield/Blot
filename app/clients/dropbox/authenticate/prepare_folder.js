var check_app_folder = require("./check_app_folder");
var migrate_files = require("./migrate_files");
var create_folder = require("./create_folder");

module.exports = function prepare_folder(req, res, next) {
  var full_access = req.new_account.full_access;
  var new_account_id = req.new_account.account_id;

  // My general strategy is to create a folder
  // on behalf of the user somewhere in their
  // Dropbox. This location depends on the permissions
  // they have granted us. I will also offer a one
  // click 'undo feature' which will remove the folder
  // where possible and revoke Blot's access in the case
  // of an accidental click or something like that.

  // We really should be able to use the user's existing
  // folder instead of creating a whole new one.
  // if (full_access && req.account && req.account.account_id === new_account_id)
  //   return select_existing_folder(req, res, next);

  // If we have access to the entire Dropbox folder
  // just create a new folder for this site in the
  // root directory of the user's dropbox, then
  // tell them they can move it wherever they like.
  if (full_access) return create_folder(req, res, next);

  // We basically need to determine if there is another
  // site using the app folder. It's possible that there
  // is another site using this dropbox, but with full
  // permission. or another site using a subfolder
  // inside the app folder.
  check_app_folder(req.blog.id, new_account_id, function(
    err,
    no_blogs_in_app_folder,
    other_blog_using_entire_app_folder
  ) {
    if (err) return next(err);

    // There are no other sites anywhere inside this Dropbox
    // folder so let's just use the entire app folder.
    if (no_blogs_in_app_folder) return next();

    // If there are no other blogs using the *entire* app folder, as opposed
    // to a subfolder inside it, this means we can just create an additional
    // sub folder in the app folder for this new site.
    if (!other_blog_using_entire_app_folder)
      return create_folder(req, res, next);

    // Since the other site uses the app folde as root
    // we need to move its files into a sub folder, then
    // create a new folder for this site.
    req.existing_blog = other_blog_using_entire_app_folder;
    req.existing_account = other_blog_using_entire_app_folder;

    return migrate_files(req, res, next);
  });
};
