module.exports = function determinePath(req, res, next) {
  var dir = req.path.slice("/~".length) || "/";

  dir = decodeURIComponent(dir);

  if (dir === '/') res.locals.root = true;
  
  req.dir = dir;

  next();
};
