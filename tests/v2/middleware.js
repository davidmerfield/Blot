var render = require('./render');

module.exports = function (req, res, next) {

  res.renderView = render(req, res);

  return next();
};