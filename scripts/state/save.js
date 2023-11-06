// We might also consider moving the cache, tmp and logs
// directory in future should it ever become important.
// They're not, right now though.

require("../only_locally");

var fs = require("fs-extra");
var yesno = require("yesno");
var client = require("client");
var colors = require("colors");
var moment = require("moment");
var ROOT = require("helper/rootDir");

var DATA_DIRECTORY = ROOT + "/data";

if (require.main === module) {
  main(process.argv[2], process.argv[3], function (err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  });
}

function main (label, description, callback) {
  var directory = __dirname + "/data/" + (label || Date.now().toString());

  // Copy old description if no new one provided
  if (!description && fs.existsSync(directory + "/description.txt"))
    description = fs.readFileSync(directory + "/description.txt");

  askToOverwrite(directory, function (err) {
    if (err) return callback(err);

    // save the database to disk before copying the data directory
    client.save(function (err) {
      if (err) return callback(err);
      fs.emptyDirSync(directory);

      fs.ensureDirSync(DATA_DIRECTORY);
      fs.copySync(DATA_DIRECTORY, directory + "/data");

      if (description)
        fs.outputFileSync(directory + "/description.txt", description);

      callback();
    });
  });
}

function askToOverwrite (directory, callback) {
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
  yesno.ask(message, false, function (ok) {
    if (ok) {
      callback();
    } else {
      callback(new Error("Did not overwrite file"));
    }
  });
}

module.exports = main;
