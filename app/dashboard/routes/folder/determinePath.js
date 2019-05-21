module.exports = function determinePath(req, res, next) {
  
  var dir = '/';

  if (req.originalUrl.indexOf('/folder') > -1) dir = req.originalUrl.slice('/folder'.length);

  res.locals.folder = {};

  if (dir === '/') res.locals.folder.root = true;
  
  req.dir = dir;
  res.locals.folder.redirect = req.path;
  
  next();
};
