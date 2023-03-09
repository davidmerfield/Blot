const express = require("express");
const Import = express.Router();
const multiparty = require("multiparty");
const maxFieldsSize = 4 * 1024 * 1024; // 4mb
const maxFilesSize = 30 * 1024 * 1024; // 30mb
const { join } = require("path");
const tempDir = require("helper/tempDir")();
const wordpressImporter = require("./sources/wordpress");
const fs = require("fs-extra");

Import.use((req, res, next) => {
  res.locals.importBase = res.locals.base + "/services/import";
  res.locals.breadcrumbs.add("Services", "services");
  res.locals.breadcrumbs.add("Import", "import");
  next();
});

Import.get("/", async function (req, res) {
  try {
    const imports = await fs.readdir(join(tempDir, "import", req.blog.id));

    res.locals.imports = imports.map((i) => {
      name: i;
    });
  } catch (e) {
    //
  }

  res.render("import");
});

Import.route("/wordpress")
  .get(function (req, res) {
    res.locals.breadcrumbs.add("Wordpress", "wordpress");
    res.render("import/wordpress");
  })
  .post(function (req, res, next) {
    const uploadDir = join(tempDir, "import", req.blog.id, "wordpress");
    fs.ensureDirSync(uploadDir);
    console.log("here", uploadDir);
    const form = new multiparty.Form({
      uploadDir,
      maxFieldsSize,
      maxFilesSize,
    });

    form.parse(req, function (err, fields, files) {
      if (err) return next(err);

      req.body = fields;
      req.files = files;

      console.log("here", fields, files);
      console.log("here", files.exportUpload[0].path);
      console.log(require("fs").existsSync(files.exportUpload[0].path));
      const outputDir = fs.ensureDirSync(join(uploadDir, "output"));
      wordpressImporter(files.exportUpload[0].path, outputDir, {}, function (
        err
      ) {
        if (err) throw err;
        res.send("Done!");
      });
    });
  });

module.exports = Import;
