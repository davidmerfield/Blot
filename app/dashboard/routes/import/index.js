const express = require("express");
const Import = express.Router();
const multiparty = require("multiparty");
const maxFieldsSize = 4 * 1024 * 1024; // 4mb
const maxFilesSize = 30 * 1024 * 1024; // 30mb
const uploadDir = require("helper/tempDir")();

Import.use((req, res, next) => {
  res.locals.importBase = res.locals.base + "/services/import";
  res.locals.breadcrumbs.add("Services", "services");
  res.locals.breadcrumbs.add("Import", "import");
  next();
});

Import.get("/", function (req, res) {
  res.render("import");
});

Import.route("/wordpress")
  .get(function (req, res) {
    res.locals.breadcrumbs.add("Wordpress", "wordpress");
    res.render("import/wordpress");
  })
  .post(
    function (req, res, next) {
      const form = new multiparty.Form({
        uploadDir,
        maxFieldsSize,
        maxFilesSize,
      });

      form.parse(req, function (err, fields, files) {
        if (err) return next(err);

        req.body = fields;
        req.files = files;

        next();
      });
    },
    function (req, res) {
      console.log('here', req.body, req.files);
    }
  );

module.exports = Import;
