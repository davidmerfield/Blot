const express = require("express");
const Import = express.Router();
const multiparty = require("multiparty");
const maxFieldsSize = 4 * 1024 * 1024; // 4mb
const maxFilesSize = 30 * 1024 * 1024; // 30mb
const { join } = require("path");
const tempDir = require("helper/tempDir")();
const wordpressImporter = require("./sources/wordpress");
const fs = require("fs-extra");
const archiver = require("archiver");
const moment = require("moment");

Import.use((req, res, next) => {
  res.locals.importBase = res.locals.base + "/services/import";
  res.locals.breadcrumbs.add("Services", "services");
  res.locals.breadcrumbs.add("Import", "import");
  next();
});

Import.param("import_id", async (req, res, next) => {
  const blogImportDirectory = await fs.realpath(
    join(tempDir, "import", req.blog.id)
  );
  const userSuppliedImportDirectory = await fs.realpath(
    join(tempDir, "import", req.blog.id, req.params.import_id)
  );

  if (!userSuppliedImportDirectory.startsWith(blogImportDirectory)) {
    return next(new Error("Invalid import"));
  }

  req.importDirectory = userSuppliedImportDirectory;
  next();
});

Import.get("/", async function (req, res) {
  try {
    const imports = await fs.readdir(join(tempDir, "import", req.blog.id));

    res.locals.imports = imports.map((i) => {
      return {
        id: i,
        name: i.split("-")[0],
        started: moment(parseInt(i.split("-")[1])).fromNow(),
        complete: fs.existsSync(
          join(tempDir, "import", req.blog.id, i, "result.zip")
        ),
      };
    });
  } catch (e) {
    //
  }

  res.render("import");
});

Import.get("/download/:import_id", async function (req, res, next) {
  try {
    console.log("here!!!!");
    const resultZip = join(req.importDirectory, "result.zip");

    if (!fs.existsSync(resultZip)) {
      return next(new Error("Result zip does not exist"));
    }

    // name the output file
    res.attachment(req.params.import_id + ".zip");

    fs.createReadStream(resultZip).pipe(res);
  } catch (e) {
    return next(new Error("Failed to download import"));
  }
});

Import.post("/delete/:import_id", async function (req, res, next) {
  try {
    await fs.remove(req.importDirectory);
  } catch (e) {
    return next(new Error("Failed to remove import"));
  }

  res.redirect(req.baseUrl);
});

Import.route("/wordpress")
  .get(function (req, res) {
    res.locals.breadcrumbs.add("Wordpress", "wordpress");
    res.render("import/wordpress");
  })
  .post(function (req, res, next) {
    const uploadDir = join(
      tempDir,
      "import",
      req.blog.id,
      "wordpress-" + Date.now()
    );
    fs.ensureDirSync(uploadDir);
    const form = new multiparty.Form({
      uploadDir,
      maxFieldsSize,
      maxFilesSize,
    });

    form.parse(req, function (err, fields, files) {
      if (err) return next(err);

      req.body = fields;
      req.files = files;

      const temporaryOutputDir = join(uploadDir, "output");
      const resultZip = join(uploadDir, "result.zip");

      fs.ensureDirSync(temporaryOutputDir);
      res.redirect(req.baseUrl);

      wordpressImporter(
        files.exportUpload[0].path,
        temporaryOutputDir,
        {},
        function (err) {
          if (err) {
            console.log("err", err);
            return;
          }

          // zip the image and send it
          let archive = archiver("zip");
          const resultWS = fs.createWriteStream(resultZip);

          archive.on("end", () => {
            console.log(archive.pointer() + " total bytes");
            console.log("archiver finalized");
          });

          archive.on("error", (err) => {
            console.log("err");
          });

          // pipe the zip to response
          archive.pipe(resultWS);

          // add the image from stream to archive
          archive.directory(temporaryOutputDir, false);

          archive.finalize();
        }
      );
    });
  });

module.exports = Import;
