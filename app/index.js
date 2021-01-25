const config = require("config");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const clfdate = require("helper").clfdate;

if (cluster.isMaster) {
  const scheduler = require("./scheduler");

  console.log(clfdate(), `Master process ${process.pid} running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // The moment the first worker comes online
  // we run all the scheduled tasks
  let first_listener = true;

  cluster.on("listening", (worker, address) => {
    if (first_listener) scheduler();
    first_listener = false;
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
    console.log(
      clfdate(),
      `Worker process ${process.pid} listening on port ${config.port} in environment: ${config.environment}`
    );
  });
}
