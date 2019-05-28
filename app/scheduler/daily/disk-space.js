var exec = require("child_process").exec;
var prettySize = require("helper").prettySize;

function main(callback) {
  exec("df -k", function(err, stdout) {
    if (err) return callback(err);

    var disk = stdout
      .split("\n")[1]
      .replace(/\s+/g, " ")
      .split(" ");

    callback(null, {
      disk_space_usage: prettySize(disk[2]),
      disk_space_available: prettySize(disk[3])
    });
  });
}

if (require.main === module) require("./cli")(main);

module.exports = main;
