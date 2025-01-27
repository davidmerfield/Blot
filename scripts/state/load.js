require("../only_locally");

var fs = require("fs-extra");
var exec = require("child_process").exec;
var ROOT = require("config").blot_directory;

var DATA_DIRECTORY = ROOT + "/data";

if (!ROOT) throw new Error("Please set environment variable BLOT_DIRECTORY");

async function main (label, callback) {
  var directory = __dirname + "/data/" + label;

  if (!fs.existsSync(directory))
    return callback(new Error("No state " + label));

  exec("docker-compose stop -t 1 node-app ", { silent: true }, function (err) {
    if (err) return callback(err);
    exec("docker-compose stop -t 1 redis", { silent: true }, function (err) {
      if (err) return callback(err);

      fs.emptyDirSync(DATA_DIRECTORY);
      fs.ensureDirSync(directory + "/data");
      fs.copySync(directory + "/data", DATA_DIRECTORY);

      exec("docker-compose start redis", { silent: true }, function (err) {
        if (err) return callback(err);
        exec("docker-compose start node-app", { silent: true }, function (err) {
          if (err) return callback(err);
          setTimeout(callback, 5000);
        });
      });
    });
  });
}

if (require.main === module) {
  main(process.argv[2], function (err) {
    if (err) throw err;
    process.exit();
  });
}

module.exports = main;
