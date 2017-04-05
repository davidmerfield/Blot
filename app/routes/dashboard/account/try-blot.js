module.exports = function(server){

  var auth = require('authHandler'),
      helper = require('helper'),
      oneTimeAuth = require('../../../oneTimeAuth'),
      logger = helper.logger;

  server.get('/try-blot/:token', auth.check, function (request, response, next) {

    if (request.user || !request.params || !request.params.token)
      return next();

    var token = request.params.token;

    oneTimeAuth.validate(token, function(err, email){

      if (err || !email) return next(err || 'No email');

      logger('Try blot called successfully for email', email);

      // This ensures the subscription module doesn't freak out
      request.session.email = email;
      request.session.subscription = {customer: false};
      request.session.isFreeUser = true;

      return response.redirect('/connect');
    });
  });
};

