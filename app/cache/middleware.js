var get = require('./get');
var config = require('../../config');
var helper = require('../helper');
var _ = require('lodash');
var log = new helper.logg('Cache: Get');

function init (prefix) {

  // Prefix is used for conditional caching for
  // a particular URL, e.g. site homepage...
  prefix = prefix || '';

  return function middleware (request, response, next) {

    var fullUrl = prefix +
                  request.protocol + '://' +
                  request.get('host') +
                  request.originalUrl;

    // Don't fetch anything for logged in users
    if (request.session && (request.session.uid || !_.isEqual(_.keys(request.session), ['cookie']))) {
      log.debug('........ skipping fetch, user logged in', fullUrl);
      return next();
    } else {
      log.debug('........ checking cache for', fullUrl);
    }

    get(fullUrl, function(err, content, type) {

      if (err) return next(err);

      if (!content || !type) {
        log.debug('-------- No cached copy found', fullUrl);
        return next();
      }

      // Should also perhaps GZIP shit now?
      response.header('Content-Type', type);
      response.send(content);

      log.debug('>>>>>>>> Sent fetched cache copy', fullUrl);

      // If we need to do stuff after cache
      // like track views or something, do.
    });
  };
}

if (config.cache === false) {
  log.debug('disabled in the config');
  module.exports = function () {
    return function (request, response, next) {
      next();
    };
  };
} else {
  module.exports = init;
}