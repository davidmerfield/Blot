var express = require("express");
var Import = express.Router();

Import.use((req, res, next)=>{
  res.locals.importBase = res.locals.base + '/services/import';
  res.locals.breadcrumbs.add("Services", "services");
  res.locals.breadcrumbs.add("Import", "import");
  next();
});

Import.get("/", function (req, res) {
  res.render("import");
});

Import.get("/wordpress", function (req, res) {
  res.locals.breadcrumbs.add("Wordpress", "wordpress");
  res.render("import/wordpress");
});

module.exports = Import;
