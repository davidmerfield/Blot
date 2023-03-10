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
const prettySize = require("helper/prettySize");
const redis = require("redis");
const client = require("client");

Import.use((req, res, next) => {
  res.locals.importBase = res.locals.base + "/services/import";
  res.locals.breadcrumbs.add("Services", "services");
  res.locals.breadcrumbs.add("Import", "import");
  next();
});

Import.param("importID", async (req, res, next) => {
  const blogImportDirectory = await fs.realpath(
    join(tempDir, "import", req.blog.id)
  );
  const userSuppliedImportDirectory = await fs.realpath(
    join(tempDir, "import", req.blog.id, req.params.importID)
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
      let size;
      let started;
      let identifier;
      let lastStatus;
      let error;

      try {
        size = prettySize(
          Math.round(
            fs.statSync(join(tempDir, "import", req.blog.id, i, "result.zip"))
              .size / 1000
          )
        );
      } catch (e) {}

      try {
        started = moment(parseInt(i.split("-")[1])).fromNow();
      } catch (e) {}

      try {
        identifier = fs.readFileSync(
          join(tempDir, "import", req.blog.id, i, "identifier.txt"),
          "utf-8"
        );
      } catch (e) {}

      try {
        error = fs.readFileSync(
          join(tempDir, "import", req.blog.id, i, "error.txt"),
          "utf-8"
        );
      } catch (e) {}

      try {
        lastStatus = fs.readFileSync(
          join(tempDir, "import", req.blog.id, i, "status.txt"),
          "utf-8"
        );
      } catch (e) {}

      return {
        id: i,
        name: i.split("-")[0],
        identifier,
        size,
        error,
        lastStatus: !!error ? error : lastStatus,
        started,
        complete: !!size,
      };
    });

    console.log(res.locals.imports);
  } catch (e) {
    //
  }

  res.render("import");
});

Import.get("/download/:importID", async function (req, res, next) {
  try {
    const resultZip = join(req.importDirectory, "result.zip");

    if (!fs.existsSync(resultZip)) {
      return next(new Error("Result zip does not exist"));
    }

    // name the output file
    res.attachment(req.params.importID + ".zip");

    fs.createReadStream(resultZip).pipe(res);
  } catch (e) {
    return next(new Error("Failed to download import"));
  }
});

Import.post("/delete/:importID", async function (req, res) {
  try {
    await fs.remove(req.importDirectory);
  } catch (e) {
    return res.message(req.baseUrl, new Error("Failed to remove import"));
  }

  res.message(req.baseUrl, "Removed import");
});

Import.get("/status", function (req, res) {
  var blogID = req.blog.id;
  var client = redis.createClient();

  req.socket.setTimeout(2147483647);

  res.writeHead(200, {
    // This header tells NGINX to NOT
    // buffer the response. Otherwise
    // the messages don't make it to the client.
    // A similar problem to the one caused
    // by the compression middleware a few lines down.
    "X-Accel-Buffering": "no",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  res.write("\n");

  client.subscribe("import:status:" + blogID);

  client.on("message", function (channel, message) {
    res.write("\n");
    res.write("data: " + message + "\n\n");
    res.flushHeaders();
  });

  // In case we encounter an error...print it out to the console
  client.on("error", function (err) {
    console.log("Redis Error: " + err);
  });

  req.on("close", function () {
    client.unsubscribe();
    client.quit();
  });
});

Import.route("/wordpress")
  .get(function (req, res) {
    res.locals.breadcrumbs.add("Wordpress", "wordpress");
    res.render("import/wordpress");
  })
  .post(function (req, res) {
    const importID = "Wordpress-" + Date.now();

    const uploadDir = join(tempDir, "import", req.blog.id, importID);

    fs.ensureDirSync(uploadDir);

    const form = new multiparty.Form({
      uploadDir,
      maxFieldsSize,
      maxFilesSize,
    });

    form.parse(req, function (err, fields, files) {
      if (err) {
        return res.message(req.baseUrl, new Error("Failed to parse upload"));
      }

      res.message(req.baseUrl, "Began import");

      req.body = fields;
      req.files = files;

      const temporaryOutputDir = join(uploadDir, "output");
      const resultZip = join(uploadDir, "result.zip");

      fs.ensureDirSync(temporaryOutputDir);

      const identifier = files.exportUpload[0].originalFilename;
      const inputXML = files.exportUpload[0].path;

      fs.outputFileSync(join(uploadDir, "identifier.txt"), identifier, "utf-8");

      const lastStatus = join(uploadDir, "status.txt");

      const reportStatus = function (status) {
        console.log("reporting status", status);
        // should write to disk somehow
        client.publish(
          "import:status:" + req.blog.id,
          JSON.stringify({ status, importID })
        );
        fs.outputFile(lastStatus, status);
      };

      wordpressImporter(
        inputXML,
        temporaryOutputDir,
        reportStatus,
        {},
        function (err) {
          if (err) {
            return fs.outputFile(join(uploadDir, "error.txt"), err.message);
          }

          // zip the image and send it
          let archive = archiver("zip");
          const resultWS = fs.createWriteStream(resultZip);

          archive.on("end", () => {
            console.log(archive.pointer() + " total bytes");
            console.log("archiver finalized");
            reportStatus("Finished");
          });

          archive.on("error", (err) => {
            fs.outputFile(join(uploadDir, "error.txt"), err.message);
            return;
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
