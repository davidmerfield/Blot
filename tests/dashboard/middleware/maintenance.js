var config = require('config');

module.exports = function (req, res, next) {

  if (config.maintenance && req.url !== '/maintenance')
    return res.redirect('/maintenance');

  next();
};