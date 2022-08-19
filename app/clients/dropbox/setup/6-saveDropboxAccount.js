var database = require("clients/dropbox/database");
module.exports = function saveDropboxAccount(req, res, next) {
  req.status.saveDropboxAccount.active();
  database.set(req.blog.id, req.unsavedAccount, function (err) {
    if (err) return next(err);
    // The front-end listens for this message, so if you change it
    // also update views/preparing.html
    req.status.saveDropboxAccount.done();
    next();
  });
};
