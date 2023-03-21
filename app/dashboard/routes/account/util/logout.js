module.exports = function (req, res, next) {
  if (!req.session) return next();

  req.session.destroy(function (err) {
    if (err) return next(err);

    res.clearCookie("signed_into_blot", { domain: "", path: "/" });
    res.clearCookie("connect.sid", { domain: "", path: "/" });

    next();
  });
};
