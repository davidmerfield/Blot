var User = require("user");

module.exports = function(req, res, next) {
  if (!req.session || !req.session.uid) return next();

  var uid = req.session.uid;

  User.getById(uid, function(err, user) {
    if (err) return next(err);

    if (!user) {
      req.user = null;
      req.session.uid = null;
      return next();
    }

    // Lets append the user and
    // set the partials to 'logged in mode'
    req.user = User.extend(user);
    res.locals.user = user;

    next();
  });
};
