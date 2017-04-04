var csrf = require('csurf');

module.exports = function (req, res, next) {

  csrf()(req, res, function(){

    res.locals.csrftoken = req.csrfToken();

    next();
  });
};