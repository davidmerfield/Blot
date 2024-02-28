require("../only_locally");

var fs = require("fs-extra");
var exec = require("child_process").exec;
var redis = require("redis");
var ROOT = process.env.BLOT_DIRECTORY;

var DATA_DIRECTORY = ROOT + "/data";

if (!ROOT) throw new Error("Please set environment variable BLOT_DIRECTORY");

async function main (label, callback) {
  var directory = __dirname + "/data/" + label;

  if (!fs.existsSync(directory))
    return callback(new Error("No state " + label));

  var client = redis.createClient();
  var multi = client.multi();

  // If redis was already shut down, then
  // we won't be able to execute the multi()
  client.on("error", function (err) {
    if (err.code === "ECONNREFUSED") {
      then();
    }
  });

  multi.config("SET", "appendonly", "no").config("SET", "save", "").shutdown();

  multi.exec(then);

  function then () {
    fs.emptyDirSync(DATA_DIRECTORY);
    fs.ensureDirSync(directory + "/data");
    fs.copySync(directory + "/data", DATA_DIRECTORY);

    exec(
      "redis-server --daemonize yes --dir " + ROOT + "/data",
      { silent: true },
      function (err) {
        if (err) return callback(err);
        callback(null);
      }
    );
  }
}

if (require.main === module) {
  main(process.argv[2], function (err) {
    if (err) throw err;
    process.exit();
  });
}

module.exports = main;
