const async = require("async");
const fs = require("fs-extra");
const archiver = require("archiver");
const { blot_directory } = require("config");

const VIEW_DIRECTORY = blot_directory + "/app/documentation/data/templates";
const FOLDER_DIRECTORY = __dirname;

const main = () => {
  return new Promise((resolve, reject) => {
    const folders = fs
      .readdirSync(FOLDER_DIRECTORY)
      .filter(i => i.indexOf(".") === -1);

    fs.ensureDirSync(VIEW_DIRECTORY + "/data");

    async.eachSeries(
      folders,
      (folder, next) => {
        const outputPath = VIEW_DIRECTORY + "/data/" + folder + ".zip";

        fs.removeSync(outputPath);

        const output = fs.createWriteStream(outputPath);

        const archive = archiver("zip", {
          zlib: { level: 9 } // Sets the compression level.
        });

        output.on("close", function () {
          console.log(archive.pointer() + " total bytes for", folder);
          next();
        });

        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        archive.on("warning", function (err) {
          if (err.code === "ENOENT") {
            // log warning
          } else {
            // throw error
            throw err;
          }
        });

        // good practice to catch this error explicitly
        archive.on("error", function (err) {
          reject(err);
        });

        archive.pipe(output);

        // append files from a sub-directory, putting its contents at the root of archive
        archive.directory(FOLDER_DIRECTORY + "/" + folder + "/", false);

        console.log("zipping", folder);
        archive.finalize();
      },
      resolve
    );
  });
};

if (require.main === module) {
  main(function (err) {
    if (err) throw err;
    process.exit();
  });
}

module.exports = main;
