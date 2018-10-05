module.exports = function checkUnsavedAccount(req, res, next) {
  if (!req.session.unsavedAccount) return next(new Error("No account"));

  req.unsavedAccount = req.session.unsavedAccount;
  next();
};
