var renderFile = require("./renderFile");
var renderFolder = require("./renderFolder");
var breadcrumbs = require("./breadcrumbs");
var determinePath = require("./determinePath");
var router = require("express").Router();

router
  .use(function(req, res, next) {
    res.locals.partials.entry = "folder/entry";
    res.locals.partials.stat = "folder/stat";
    res.locals.partials.file = "folder/file";
    res.locals.partials.directory = "folder/directory";
    res.locals.partials.folder = "folder/wrapper";
    next();
  })
  .use(determinePath)
  .use(breadcrumbs)
  .use(renderFolder)
  .use(renderFile)
  .use(function(err, req, res, next) {
    console.log(err);
    // suppress errors
    next();
  });

router.post("/path", function(req, res) {
  req.session[req.blog.id] = req.session[req.blog.id] || {};
  req.session[req.blog.id].path = req.body.path || "/";
  return res.redirect(req.body.redirect || "/");
});

module.exports = router;
