require("../only_locally");

var fs = require("fs-extra");
var exec = require("child_process").exec;
var redis = require("redis");
var cp = require("child_process");
var ROOT = process.env.BLOT_DIRECTORY;

var DATA_DIRECTORY = ROOT + "/data";
var BLOG_FOLDERS_DIRECTORY = ROOT + "/blogs";
var GIT_CLIENTS_DATA = ROOT + "/app/clients/git/data";
var STATIC_FILES_DIRECTORY = ROOT + "/static";
var ACTIVE_DATABASE_DUMP = ROOT + "/db/dump.rdb";

if (!ROOT) throw new Error("Please set environment variable BLOT_DIRECTORY");

async function main(label, callback) {
  var directory = __dirname + "/data/" + label;

  console.log(directory, "exists?", fs.existsSync(directory));
  console.log(directory, "contents", fs.readdirSync(__dirname + "/data"));

  if (!fs.existsSync(directory))
    return callback(new Error("No state " + label));

  if (!fs.existsSync(DATA_DIRECTORY + "/db/postgres")) {
    fs.ensureDirSync(DATA_DIRECTORY + "/db/postgres");
    cp.execSync("initdb -D " + DATA_DIRECTORY + "/db/postgres");
  }

  try {
    await cp.exec(
      "pg_ctl -s -l logs/post.log  stop -D " + DATA_DIRECTORY + "/db/postgres",
      {
        stdio: "inherit",
      }
    );
  } catch (e) {
    console.log("here!", e.message);
    if (e.message.includes("Is server running?")) {
      console.log("postgres not running right now.");
    } else {
      throw e;
    }
  }

  loadDB(directory, function (err) {
    if (err) return callback(err);

    fs.emptyDirSync(DATA_DIRECTORY);
    fs.ensureDirSync(directory + "/data");
    fs.copySync(directory + "/data", DATA_DIRECTORY);

    if (!fs.existsSync(DATA_DIRECTORY + "/db/postgres")) {
      cp.execSync("initdb -D " + DATA_DIRECTORY + "/db/postgres");
    }

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
