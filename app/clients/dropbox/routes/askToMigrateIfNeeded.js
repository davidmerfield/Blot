module.exports = function askToMigrateIfNeeded(req, res, next) {
  if (req.otherBlogUsingEntireAppFolder) {
    req.session.unsavedAccount = req.unsavedAccount;
    res.redirect(req.baseUrl + "/migrate");
  } else {
    next();
  }
};
