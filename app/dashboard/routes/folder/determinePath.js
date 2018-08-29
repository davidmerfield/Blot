module.exports = function determinePath(req, res, next) {
  var dir = req.session.path || "/";

  if (dir === '/') res.locals.root = true;
  
  req.dir = dir;
  res.locals.redirect = req.path;
  next();
};
