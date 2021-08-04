var database = require("clients/dropbox/database");
module.exports = function saveDropboxAccount(req, res, next) {
  database.set(req.blog.id, req.unsavedAccount, next);
};
