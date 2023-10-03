var exec = require("child_process").exec;
var prettySize = require("helper/prettySize");

function main (callback) {
  exec("df -k", function (err, stdout) {
    if (err) return callback(err);

    const disk_line = stdout.split("\n")[7].replace(/\s+/g, " ").split(" ");
    const node_root_disk_line = stdout
      .split("\n")[5]
      .replace(/\s+/g, " ")
      .split(" ");

    callback(null, {
      disk_space_usage: prettySize(disk_line[2]),
      disk_space_available: prettySize(disk_line[3]),
      node_root_disk_usage: prettySize(node_root_disk_line[2]),
      node_root_disk_available: prettySize(node_root_disk_line[3])
    });
  });
}

if (require.main === module) require("./cli")(main);

module.exports = main;
