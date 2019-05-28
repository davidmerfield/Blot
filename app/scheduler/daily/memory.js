var exec = require("child_process").exec;
var config = require("config");
var prettySize = require("helper").prettySize;

function main(callback) {
  if (config.environment !== "production") return callback();

  exec("free -k", function(err, stdout) {
    var line = stdout
      .split("\n")[1]
      .replace(/\s+/g, " ")
      .split(" ");
    var usage = line[2];
    var available = line[3];

    callback(null, {
      memory_usage: prettySize(usage),
      memory_available: prettySize(available)
    });
  });
}

module.exports = main;

if (require.main === module) require("./cli")(main);
