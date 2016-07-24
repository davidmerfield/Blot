var config = require('config');
var PRODUCTION = config.environment !== 'development';

module.exports = function (req, res, next) {

  if (!req.secure && PRODUCTION) {

    // req.originalUrl is much like req.url
    // however, it retains the original request url
    // allowing you to rewrite req.url freely for
    // internal routing purposes. For example, the
    // "mounting" feature of app.use() will rewrite
    // req.url to strip the mount point.

    var secure = 'https://' + req.hostname + req.originalUrl;

    return res.redirect(secure);
  }

  next();
};