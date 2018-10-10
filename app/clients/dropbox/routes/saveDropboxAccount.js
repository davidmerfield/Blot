var database = require("../database");
module.exports = function saveDropboxAccount(req, res, next) {
  database.set(req.blog.id, req.unsavedAccount, function(err) {
    if (err) return next(err);

    res.message("/", "Set up Dropbox successfuly!");
  });
};
