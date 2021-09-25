var renderFile = require("./renderFile");
var renderFolder = require("./renderFolder");
var breadcrumbs = require("./breadcrumbs");
var determinePath = require("./determinePath");
var router = require("express").Router();
var trace = require("helper/trace");

router
  .use(function (req, res, next) {
    res.locals.partials.entry = "folder/entry";
    res.locals.partials.stat = "folder/stat";
    res.locals.partials.file = "folder/file";
    res.locals.partials.directory = "folder/directory";
    res.locals.partials.folder = "folder/wrapper";
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
    console.log(err);
    // suppress errors
    next();
  });

router.post("/path", function (req, res) {
  req.session[req.blog.id] = req.session[req.blog.id] || {};
  req.session[req.blog.id].path = req.body.path || "/";
  return res.redirect(req.body.redirect || "/");
});

module.exports = router;
