var yesno = require("yesno");
var fs = require("fs-extra");
var colors = require("colors");
var moment = require("moment");

function main(label, callback) {
  var message = "";
  var directory = __dirname + "/data/" + label;

  try {
    message += colors.yellow(label);

    if (fs.existsSync(directory + "/description.txt"))
      message +=
        " - " + fs.readFileSync(directory + "/description.txt", "utf-8");

    message +=
      " - " + colors.green(moment(fs.statSync(directory).mtime).fromNow());

    yesno.ask(
      "Are you sure you want to remove " + message + "? (y/n)",
      false,
      function (ok) {
        if (ok) {
          console.log("Removing", directory);
          fs.removeSync(directory);
          callback();
        } else {
          callback(new Error("Not ok"));
        }
      }
    );
  } catch (e) {
    if (e && e.code === "ENOENT")
      callback(new Error("No state called " + label));

    callback(e);
  }
}

if (require.main === module) {
  main(process.argv[2], function (err) {
    if (err) throw err;
    process.exit();
  });
}

module.exports = main;
