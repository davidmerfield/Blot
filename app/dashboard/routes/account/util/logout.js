module.exports = function(req, res, next) {
  if (!req.session) return next();

  req.session.destroy(function(err) {
    if (err) return next(err);

    res.clearCookie("connect.sid");
    next();
  });
};
