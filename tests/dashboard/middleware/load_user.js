var db = require('db');
var User = db.user;

module.exports = function (req, res, next) {

  function no_user () {

    delete req.user;

    var err = new Error('No blog');

    err.code = 'NOUSER';

    return next(err);
  }

  if (!req.session) return no_user();

  var uid = req.session.uid;

  if (!uid) return no_user();

  User.getBy({uid: uid}, function(err, user){

    if (err) return next(err);

    if (!user) return no_user();

    // Need to allow post requests
    if (user.isUnpaid || user.isPastDue) {

      // to view pay page or to submit their new payment
      if (req.method === 'POST' || req.url === '/pay-subscription')
        return next();

      // otherwise make them pay muah ha ha.
      return res.redirect('/pay-subscription');
    }

    // Lets append the user and
    // set the partials to 'logged in mode'
    res.locals.user = user;
    req.user = user;

    next();
  });
};