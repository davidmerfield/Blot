var csurf = require("csurf");

module.exports = function(req, res, next) {
  csurf()(req, res, function(err) {
    res.locals.csrftoken = req.csrfToken();
    req.next();
  });
};
