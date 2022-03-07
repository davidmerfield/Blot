console.log("Build process launched pid:", process.pid);

const dependency = require("./dependency");
const client = require("client");

module.exports = function build({ data }, callback) {
  console.log("Build process running, pid", process.pid, "data:", data);

  if (data.throw) throw new Error("Simulated uncaught exception");

  if (data.exitWithError) return process.exit(1);

  dependency(data);

  const delay = Math.random() * 1000;

  client.ping(function (err, stat) {
    if (err) return callback(err);
    console.log("Pong from redis?", stat);
    console.log("Waiting", delay, "ms to finish job...");
    setTimeout(function () {
      console.log("Waited", delay, "ms");
      callback(null, "Success");
    }, delay);
  });
};
