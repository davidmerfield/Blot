var User = require("user");
var LogInError = require('./LogInError');

module.exports = function checkEmail(req, res, next) {
  var email = req.body && req.body.email;

  if (!email) return next(new LogInError("NOEMAIL"));

  User.getByEmail(email, function(err, user) {
    if (err) return next(err);

    // The supplied email address does not
    // match a user in our database.
    if (!user) return next(new LogInError("BADEMAIL"));

    req.user = user;
    res.locals.email = user.email;
    res.locals.then = req.query.then;

    next();
  });
};
