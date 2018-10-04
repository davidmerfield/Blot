var createClient = require("../util/createClient");

module.exports = function(req, res, next) {

  if (req.unsavedAccount.full_access === false && !req.otherBlogsUseAppFolder)
    return next();

  var client = createClient(req.unsavedAccount.access_token);


  // check if // The user has an existing dropbox account stored
      // if (
      //   !req.account ||
      //   req.unsavedAccount.account_id !== req.account.account_id ||
      //   req.unsavedAccount.full_access !== req.account.full_access
      // ) {
      //   next();
      // } else {
      //   database.set(req.blog.id, { access_token: req.token, error_code: 0 }, function(err) {
      //     if (err) return next(err);
      //     res.message("/", "Set up Dropbox successfuly!");
      //   });
      // }


  client
    .filesCreateFolder({ path: "/" + req.blog.title, autorename: true })
    .then(function(res) {

      req.unsavedAccount.folder = res.path_display;
      req.unsavedAccount.folder_id = res.id;

      next();
    })
    .catch(next);
};
