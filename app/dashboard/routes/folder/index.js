var renderFile = require("./renderFile");
var renderFolder = require("./renderFolder");
var breadcrumbs = require("./breadcrumbs");
var determinePath = require("./determinePath");
var router = require("express").Router();
var trace = require("helper/trace");

router
  .use(function (req, res, next) {
    res.locals.partials = {
      ...res.locals.partials,
      entry: "folder/entry",
      stat: "folder/stat",
      file: "folder/file",
      directory: "folder/directory",
      folder: "folder/wrapper",
    };
    next();
  })
  .use(trace("determining path"))
  .use(determinePath)
  .use(trace("determining breadcrumbs"))
  .use(breadcrumbs)
  .use(trace("renderFolder"))
  .use(renderFolder)
  .use(trace("renderFile"))
  .use(renderFile)
  .use(function (err, req, res, next) {
    if (err && err.code === "ENOENT") return next();
    next(err);
  });

module.exports = router;
