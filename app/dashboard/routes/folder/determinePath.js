module.exports = function determinePath(req, res, next) {
  
  var dir;

  req.session[req.blog.id] = req.session[req.blog.id] || {};
  dir = req.session[req.blog.id].path || "/";
  res.locals.folder = {};

  if (dir === '/') res.locals.folder.root = true;
  
  req.dir = dir;
  res.locals.folder.redirect = req.path;
  
  next();
};
