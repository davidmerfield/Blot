var database = require("clients/dropbox/database");
module.exports = function saveDropboxAccount(req, res, next) {
  req.folder.status("Saving your Dropbox account details");
  database.set(req.blog.id, req.unsavedAccount, function (err) {
    if (err) return next(err);
    // The front-end listens for this message, so if you change it
    // also update views/preparing.html
    req.folder.status("Saved your Dropbox account details");
    next();
  });
};
