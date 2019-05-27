var User = require("user");
var LogInError = require('./logInError');

module.exports = function checkEmail(req, res, next) {
  var email = req.body && req.body.email;

  if (!email) return next(new LogInError("NOEMAIL"));

  User.getByEmail(email, function(err, user) {
    if (err) return next(err);

    // The supplied email address does not
    // match a user in our database.
    if (!user) return next(new LogInError("BADEMAIL"));

    // You used to be able to disable your account
    // but this is no longer possible. Once all 
    // users with isDisabled:true are removed you
    // can delete this check safely.
    if (user.isDisabled) return res.redirect('/account/disabled')

    req.user = user;
    res.locals.email = user.email;
    res.locals.then = req.query.then;

    next();
  });
};
