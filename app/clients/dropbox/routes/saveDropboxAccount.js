var database = require("../database");
module.exports = function saveDropboxAccount(req, res, next) {

  console.log(
    "Blog:",
    req.blog.id,
    "Saving new Dropbox account with full access:",
    req.unsavedAccount.full_access
  );

  database.set(req.blog.id, req.unsavedAccount, function(err) {
    
    if (err) return next(err);

    res.message("/", "Set up Dropbox successfuly!");
  });
};
