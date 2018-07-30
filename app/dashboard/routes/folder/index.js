var renderFile = require("./renderFile");
var renderFolder = require("./renderFolder");
var breadcrumbs = require("./breadcrumbs");
var determinePath = require("./determinePath");
var router = require("express").Router();

router
  .use(function(req, res, next) {
    console.log("loading folder on", req.originalUrl);
    next();
  })
  .use(determinePath)
  .use(breadcrumbs)
  .use(renderFolder)
  .use(renderFile)
  .use(function(err, req, res, next) {
    // suppress errors
    next();
  });

module.exports = router;
