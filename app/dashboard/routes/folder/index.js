var renderFile = require("./renderFile");
var renderFolder = require("./renderFolder");
var breadcrumbs = require("./breadcrumbs");
var determinePath = require("./determinePath");
var router = require("express").Router();

router
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