const config = require("config");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const clfdate = require("helper").clfdate;
const async = require("async");
if (cluster.isMaster) {
  // Launch scheduled tasks
  require("./scheduler")();

  console.log(
    clfdate(),
    `Master process running pid=${process.pid} environment=${config.environment} cache=${config.cache}`
  );

  // Write the master process PID so we can signal it
  require("fs").writeFileSync(config.pidfile, process.pid, "utf-8");

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(clfdate(), "worker is dead");
    if (worker.exitedAfterDisconnect === true) {
      // we only want to reboot if the worker died by error
    } else {
      cluster.fork();
    }
  });

  // SIGUSR1 is used by node for debugging, so we use SIGUSR2 to
  // signal the master process that it's time to reboot the servers
  process.on("SIGUSR2", function () {
    let workerIDs = Object.keys(cluster.workers);

    console.log(
      clfdate(),
      `Master process recieved signal to replace ${workerIDs.length} workers`
    );

    async.eachSeries(
      workerIDs,
      function (workerID, next) {
        let worker;
        let replacementWorker;
        let timeout;

        console.log(
          clfdate(),
          `Replacing worker ${workerIDs.indexOf(workerID) + 1}/${
            workerIDs.length
          }`
        );

        worker = cluster.workers[workerID];

        worker.on("disconnect", function () {
          clearTimeout(timeout);
        });

        worker.disconnect();

        timeout = setTimeout(() => {
          worker.kill();
        }, 2000);

        replacementWorker = cluster.fork();

        replacementWorker.on("listening", function () {
          console.log(
            clfdate(),
            `Replaced worker ${workerIDs.indexOf(workerID) + 1}/${
              workerIDs.length
            }`
          );
          workerID++;
          next();
        });
      },
      function (err) {
        console.log(clfdate(), `Master process replaced all workers`);
      }
    );
  });
} else {
  console.log(clfdate(), `Worker process running pid=${process.pid}`);

  // Open the server to handle requests
  require("./server").listen(config.port, function () {
    console.log(
      clfdate(),
      `Worker process listening pid=${process.pid} port=${config.port}`
    );
  });
}
