var Express = require("express");
var templates = new Express.Router();
var sharp = require("sharp");
var fs = require("fs-extra");
var viewDirectory = fs.realpathSync(__dirname + "/../views/templates");

var folders = {
  archive: "ferox",
  console: "bjorn",
  default: "bjorn",
  magazine: "magazine",
  photos: "bjorn",
  portfolio: "bjorn",
  rosa: "bjorn"
};

templates.use(function(req, res, next) {
  if (!req.query.size) return next();

  var width = req.query.size === "thumbnail" ? 368 : 1266;
  var path = viewDirectory + req.path;
  var transformer = sharp().resize({
    width: width,
    fit: sharp.fit.inside
  });

  fs.realpath(path, function(err, path) {
    if (err) return next(err);
    if (path.indexOf(viewDirectory) !== 0) return next();

    fs.createReadStream(path)
      .pipe(transformer)
      .pipe(res);
  });
});

templates.get("/:template", function(req, res, next) {
  res.locals.folder = folders[req.params.template];
  res.locals.preview =
    "http://preview." +
    req.params.template +
    "." +
    res.locals.folder +
    ".blot.im";

  next();
});

module.exports = templates;
