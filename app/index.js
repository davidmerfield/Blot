const config = require("config");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const clfdate = require("helper").clfdate;

if (cluster.isMaster) {
  const scheduler = require("./scheduler");

  console.log(clfdate(), `Master process ${process.pid} running`);

  // Schedule backups, subscription renewal emails
  // and the publication of scheduled blog posts.
  scheduler();

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("fork", (worker) => {
    // console.log("worker is dead:", worker.isDead());
  });

  cluster.on("exit", (worker, code, signal) => {
    console.log("worker is dead:", worker.isDead());
    cluster.fork();
  });

} else {
  const Blot = require("./server");

  console.log(clfdate(), `Worker process ${process.pid} running`);

  // Open the server to handle requests
  Blot.listen(config.port, function () {
    console.log(clfdate(), "App listening on port", config.port);
    console.log(clfdate(), "App running in environment:", config.environment);
  });
}
