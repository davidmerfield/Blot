require("../only_locally");

const fs = require("fs-extra");
const { join } = require("path");

const DATA_DIRECTORY = join(process.cwd(), "/data");

if (!fs.existsSync(DATA_DIRECTORY)) {
  throw new Error("No data directory found at " + DATA_DIRECTORY);
}

if (!fs.existsSync(join(__dirname, "data"))) {
  throw new Error("No state directory found at " + join(__dirname, "data"));
}

if (!fs.existsSync(join(DATA_DIRECTORY, "tmp"))) {
  throw new Error("No tmp directory found at " + join(DATA_DIRECTORY, "tmp"));
}

async function main (label, callback) {
  var directory = __dirname + "/data/" + label;

  if (!fs.existsSync(directory))
    return callback(new Error("No state '" + label + "' (" + directory + ")"));

  fs.emptyDirSync(DATA_DIRECTORY);
  fs.ensureDirSync(directory + "/data");
  fs.copySync(directory + "/data", DATA_DIRECTORY);

  callback(null);
}

if (require.main === module) {
  main(process.argv[2], function (err) {
    if (err) throw err;
    process.exit();
  });
}

module.exports = main;
