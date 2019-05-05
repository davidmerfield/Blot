// We might also consider moving the cache, tmp and logs
// directory in future should it ever become important.
// They're not, right now though.

require("../only_locally");

var fs = require("fs-extra");
var async = require("async");
var helper = require("helper");
var yesno = require("yesno");
var client = require("client");

var ROOT = helper.rootDir;

var ACTIVE_DATABASE_DUMP = ROOT + "/db/dump.rdb";
var BLOG_FOLDERS_DIRECTORY = ROOT + "/blogs";
var GIT_CLIENTS_DATA = ROOT + "/app/clients/git/data";
var STATIC_FILES_DIRECTORY = ROOT + "/static";

if (require.main === module) {
  main(process.argv[2], function(err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  });
}

function main(label, callback) {
  var directory = __dirname + "/data/" + (label || Date.now().toString());

  askToOverwrite(directory, function(err) {
    if (err) return callback(err);

    async.parallel(
      [
        function(done) {
          fs.emptyDirSync(directory);

          fs.ensureDirSync(GIT_CLIENTS_DATA);
          fs.copySync(GIT_CLIENTS_DATA, directory + "/git");

          fs.ensureDirSync(STATIC_FILES_DIRECTORY);
          fs.copySync(STATIC_FILES_DIRECTORY, directory + "/static");

          fs.ensureDirSync(BLOG_FOLDERS_DIRECTORY);
          fs.copySync(BLOG_FOLDERS_DIRECTORY, directory + "/blogs");

          done();
        },
        function(done) {
          saveDB(directory, done);
        }
      ],
      callback
    );
  });
}

function askToOverwrite(path, callback) {
  if (!fs.existsSync(path)) return callback();

  yesno.ask("Overwrite existing ‘" + path + "’? y / n", false, function(ok) {
    if (ok) {
      callback();
    } else {
      callback("Do not overwrite file");
    }
  });
}

function saveDB(directory, callback) {
  client.save(function(err, stat) {
    if (err || !stat) throw err || "No stat";

    fs.copySync(ACTIVE_DATABASE_DUMP, directory + "/dump.rdb");
    callback();
  });
}

module.exports = main;
