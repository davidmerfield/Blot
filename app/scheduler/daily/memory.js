var exec = require("child_process").exec;
var config = require("config");

function main(callback) {
  if (config.environment !== "production") return callback();

  exec("free -m", function(err, stdout) {
    var line = stdout
      .split("\n")[1]
      .replace(/\s+/g, " ")
      .split(" ");
    var usage = line[3];
    var available = line[2];

    callback(null, {
      memory_usage: usage + "mb",
      memory_available: available + "mb"
    });
  });
}

module.exports = main;

if (require.main === module) require("./cli")(main);
