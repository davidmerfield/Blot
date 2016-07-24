var User = require('../../models/user');
var helper = require('../../helper');
var oneTimeAuth = require('../../oneTimeAuth');
var logger = helper.logger;

module.exports = function(server){

  server.get('/OTP/:token', function (request, response, next) {

    if (request.user) return next();

    var token = request.params.token;

    if (!token) return next();

    var redirectURL = request.query.redirect || '/';

    oneTimeAuth.validate(token, function(err, uid){

      if (err || !uid) return next(err || 'No user');

      User.getBy({uid: uid}, function (err, user){

        logger(uid, 'Authentication successful using one time pass', token);
        request.session.uid = uid;
        request.session.blogID = user.lastSession;

        return response.redirect(redirectURL);
      })
    });
  });
};