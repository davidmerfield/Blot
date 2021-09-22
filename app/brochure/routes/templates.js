var Express = require("express");
var templates = new Express.Router();
var config = require("config");

var folders = {
  blog: "bjorn",
  magazine: "magazine",
  photo: "bjorn",
  portfolio: "bjorn",
  reference: "ferox",
};

templates.get("/:template", function (req, res, next) {
  res.locals.title += " template";
  res.locals.folder = folders[req.params.template];
  res.locals.preview =
    config.protocol +
    "preview-of-" +
    req.params.template +
    "-on-" +
    res.locals.folder +
    "." +
    config.host;

  next();
});

module.exports = templates;
