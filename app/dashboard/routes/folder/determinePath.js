module.exports = function determinePath(req, res, next) {
  var dir = req.session.path || "/";

  res.locals.folder = {};

  if (dir === '/') res.locals.folder.root = true;
  
  req.dir = dir;
  res.locals.folder.redirect = req.path;
  next();
};
