// We might also consider moving the cache, tmp and logs
// directory in future should it ever become important.
// They're not, right now though.

require("../only_locally");

var fs = require("fs-extra");
var async = require("async");
var helper = require("helper");
var yesno = require("yesno");
var client = require("client");
var colors = require("colors");
var moment = require("moment");

var ROOT = helper.rootDir;

var ACTIVE_DATABASE_DUMP = ROOT + "/db/dump.rdb";
var DATA_DIRECTORY = ROOT + "/data";
var BLOG_FOLDERS_DIRECTORY = ROOT + "/blogs";
var GIT_CLIENTS_DATA = ROOT + "/app/clients/git/data";
var STATIC_FILES_DIRECTORY = ROOT + "/static";

if (require.main === module) {
  main(process.argv[2], process.argv[3], function(err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  });
}

function main(label, description, callback) {
  var directory = __dirname + "/data/" + (label || Date.now().toString());

  // Copy old description if no new one provided
  if (!description && fs.existsSync(directory + "/description.txt"))
    description = fs.readFileSync(directory + "/description.txt");

  askToOverwrite(directory, function(err) {
    if (err) return callback(err);

    async.parallel(
      [
        function(done) {
          fs.emptyDirSync(directory);

          fs.ensureDirSync(DATA_DIRECTORY);
          fs.copySync(DATA_DIRECTORY, directory + "/data");

          fs.ensureDirSync(GIT_CLIENTS_DATA);
          fs.copySync(GIT_CLIENTS_DATA, directory + "/git");

          fs.ensureDirSync(STATIC_FILES_DIRECTORY);
          fs.copySync(STATIC_FILES_DIRECTORY, directory + "/static");

          fs.ensureDirSync(BLOG_FOLDERS_DIRECTORY);
          fs.copySync(BLOG_FOLDERS_DIRECTORY, directory + "/blogs");

          if (description)
            fs.outputFileSync(directory + "/description.txt", description);

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

function askToOverwrite(directory, callback) {
  if (!fs.existsSync(directory)) return callback();

  var label = require("path").basename(directory);
  var message =
    colors.red("Are you sure you want to overwrite?") +
    "\n  Label: " +
    colors.yellow(label);

  if (fs.existsSync(directory + "/description.txt"))
    message +=
      "\n  Description: " +
      fs.readFileSync(directory + "/description.txt", "utf-8");

  message +=
    "\n  Modified: " +
    colors.green(moment(fs.statSync(directory).mtime).fromNow()) +
    "\n  Directory: " +
    directory +
    "\n\nEnter label to continue:";

  yesno.options.yes = [label];
  yesno.ask(message, false, function(ok) {
    if (ok) {
      callback();
    } else {
      callback(new Error("Did not overwrite file"));
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
