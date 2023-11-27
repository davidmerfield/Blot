module.exports = function determinePath(req, res, next) {
  var dir = req.folderPath || '/';

  res.locals.folder = {};

  if (dir === "/") res.locals.folder.root = true;

  dir = decodeURIComponent(dir);

  // Fixes an encoding bug I don't properly understand
  // "ブ".length => 1
  // "ブ".length => 2
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
  dir = dir.normalize("NFC");

  req.dir = dir;
  res.locals.folder.redirect = req.path;

  next();
};
