var _ = require("lodash");
var Redirects = require("../../../../models/redirects");

module.exports = function(req, res, next) {
  Redirects.list(req.blog.id, function(err, redirects) {
    res.locals.redirects = _.filter(redirects);

    next();
  });
};
