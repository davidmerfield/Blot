require("../only_locally");

var fs = require("fs-extra");
var directory = __dirname + "/data";
var moment = require("moment");
var colors = require("colors/safe");

fs.ensureDirSync(directory);

if (require.main === module && !process.argv[2]) {
  list(process.exit);
} else {
  var old_stdout_write = process.stdout.write;
  var old_stderr_write = process.stderr.write;

  process.stdout.write = function () {};
  process.stderr.write = function () {};

  require("./load")(process.argv[2], function (err) {
    if (err) throw err;

    require("./info")(function (err, res) {
      if (err) throw err;

      process.stdout.write = old_stdout_write;
      process.stderr.write = old_stderr_write;

      console.log(res);
      process.exit();
    });
  });
}

function list (callback) {
  console.log(colors.dim("Help:"));
  console.log(
    "node scripts/state <label>",
    colors.dim("Load application state from list below")
  );
  console.log(
    "node scripts/state/save <label>",
    colors.dim("Save existing state under label")
  );
  console.log(
    "node scripts/state/remove <label>",
    colors.dim("Delete existing state under label")
  );
  console.log(
    "node scripts/state/fetch",
    colors.dim("Download latest production db")
  );

  console.log();
  console.log("Local:");

  fs.readdirSync(directory)
    .filter(function (i) {
      return (
        i.indexOf("production-") === -1 &&
        fs.statSync(directory + "/" + i).isDirectory()
      );
    })
    .map(function (dir) {
      var message = "";
      message += colors.yellow(dir);

      if (fs.existsSync(directory + "/" + dir + "/description.txt"))
        message +=
          " - " +
          fs.readFileSync(directory + "/" + dir + "/description.txt", "utf-8");

      message +=
        " - " +
        colors.green(
          moment(fs.statSync(directory + "/" + dir).mtime).fromNow()
        );

      console.log(message);
    });

  console.log();
  console.log("Production database dumps:");
  fs.readdirSync(directory)
    .filter(function (i) {
      return (
        i.indexOf("production-") === 0 &&
        fs.statSync(directory + "/" + i).isDirectory()
      );
    })
    .map(function (dir) {
      var message = "";

      message += colors.yellow(dir);

      message +=
        " - " +
        moment(parseInt(dir.split("-")[1] * 1000)).format(
          "MMMM Do YYYY, h:mma"
        );

      message +=
        " - " +
        colors.green(
          moment(fs.statSync(directory + "/" + dir).mtime).fromNow()
        );

      console.log(message);
    });

  callback();
}
