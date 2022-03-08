require("../only_locally");

var fs = require("fs-extra");
var exec = require("child_process").exec;
var redis = require("ioredis");
var cp = require("child_process");
var ROOT = process.env.BLOT_DIRECTORY;

var DATA_DIRECTORY = ROOT + "/data";
var BLOG_FOLDERS_DIRECTORY = ROOT + "/blogs";
var GIT_CLIENTS_DATA = ROOT + "/app/clients/git/data";
var STATIC_FILES_DIRECTORY = ROOT + "/static";
var ACTIVE_DATABASE_DUMP = ROOT + "/db/dump.rdb";

if (!ROOT) throw new Error("Please set environment variable BLOT_DIRECTORY");

function main(label, callback) {
  var directory = __dirname + "/data/" + label;

  if (!fs.existsSync(directory))
    return callback(new Error("No state " + label));

  cp.execSync(
    "pg_ctl -s -l logs/post.log  stop -D " + DATA_DIRECTORY + "/db/postgres",
    {
      stdio: "inherit",
    }
  );

  loadDB(directory, function (err) {
    if (err) return callback(err);

    fs.emptyDirSync(DATA_DIRECTORY);
    fs.ensureDirSync(directory + "/data");
    fs.copySync(directory + "/data", DATA_DIRECTORY);

    // Why stdio: inherit?
    // https://github.com/shelljs/shelljs/issues/770#issuecomment-329357465
    cp.execSync(
      "pg_ctl -s -l logs/post.log start -D " + DATA_DIRECTORY + "/db/postgres"
    );

    fs.emptyDirSync(BLOG_FOLDERS_DIRECTORY);
    fs.ensureDirSync(directory + "/blogs");
    fs.copySync(directory + "/blogs", BLOG_FOLDERS_DIRECTORY);

    fs.emptyDirSync(GIT_CLIENTS_DATA);
    fs.ensureDirSync(directory + "/git");
    fs.copySync(directory + "/git", GIT_CLIENTS_DATA);

    fs.emptyDirSync(STATIC_FILES_DIRECTORY);
    fs.ensureDirSync(directory + "/static");
    fs.copySync(directory + "/static", STATIC_FILES_DIRECTORY);

    callback();
  });
}

function loadDB(directory, callback) {
  var dump = directory + "/dump.rdb";
  var client = new redis();
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

  function then() {
    fs.copySync(dump, ACTIVE_DATABASE_DUMP);

    exec(
      "redis-server " + ROOT + "/config/redis.conf",
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
