var helper = require('../helper');
var logger = helper.log({file: 'routing-errors'});

var ERROR = 'Error';
var FOUR04 = '404';

function fullURL (req) {
  return req.protocol + '://' + req.get('host') + req.originalUrl;
}

module.exports = {

  error: function error (err, req, res, next) {

    logger.prefix(err.code || ERROR);
    logger([fullURL(req), err.stack]);

    // We must keep passing the error
    // for the other handlers to be invoked
    return next(err);
  },

  four04: function four04 (req, res, next) {

    logger.prefix(FOUR04);
    logger(fullURL(req));

    return next();
  }
};
