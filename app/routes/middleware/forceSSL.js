var config = require('config');

module.exports = function forceSSL (req, res, next) {

  if (req.secure) return next();

  return res.redirect('https://' + config.host + req.url);
};