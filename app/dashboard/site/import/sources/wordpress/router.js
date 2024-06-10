const express = require("express");
const Importer = express.Router();

const fs = require("fs-extra");
const { join } = require("path");

const init = require("dashboard/site/import/init");

const multiparty = require("multiparty");

const maxFieldsSize = 4 * 1024 * 1024; // 4mb
const maxFilesSize = 30 * 1024 * 1024; // 30mb

const wordpress = require("./index");

Importer.route("/wordpress")
  .get(function (req, res) {
    res.locals.breadcrumbs.add("Wordpress", "wordpress");
    res.render("dashboard/import/wordpress");
  })
  .post(function (req, res) {
    const { importDirectory, outputDirectory, finish, status } = init({
      blogID: req.blog.id,
      label: "Wordpress",
    });

    const form = new multiparty.Form({
      importDirectory,
      maxFieldsSize,
      maxFilesSize,
    });

    form.parse(req, function (err, fields, files) {
      if (err) {
        return res.message(req.baseUrl, new Error("Failed to parse upload"));
      }

      res.message(req.baseUrl, "Began import");

      const exportUpload = files.exportUpload[0];
      const identifier = exportUpload.originalFilename;
      const inputXML = exportUpload.path;

      fs.outputFileSync(
        join(importDirectory, "identifier.txt"),
        identifier,
        "utf-8"
      );

      wordpress(inputXML, outputDirectory, status, {}, async function (err) {
        if (err) {
          return fs.outputFile(join(importDirectory, "error.txt"), err.message);
        }

        try {
          await finish();
        } catch (err) {
          fs.outputFile(join(importDirectory, "error.txt"), err.message);
        }
      });
    });
  });

module.exports = Importer;
