const async = require("async");
const fs = require("fs-extra");
const config = require("config");
const cluster = require("cluster");
const clfdate = require("helper/clfdate");
const email = require("helper/email");
const setup = require("./setup");

if (cluster.isMaster) {
  const NUMBER_OF_CORES = require("os").cpus().length;
  const NUMBER_OF_WORKERS =
    NUMBER_OF_CORES > 4 ? Math.round(NUMBER_OF_CORES / 2) : 2;
  const scheduler = require("./scheduler");
  const publishScheduledEntries = require("./scheduler/publish-scheduled-entries");

  // In development mode we sometimes want to run
  // just the dashboard, since the server boot is slow
  // Remove once we get the server online faster
  if (process.env.FAST !== "true") {
    setup(function (err) {
      if (err) throw err;
      console.log("Finished setting up");
    });
  }

  console.log(
    clfdate(),
    `Starting pid=${process.pid} environment=${config.environment} cache=${config.cache}`
  );

  email.SERVER_START();

  // Write the master process PID so we can signal it
  fs.outputFileSync(config.pidfile, process.pid.toString(), "utf-8");

  // Run any initialization that clients need
  // Google Drive will renew any webhooks, e.g.
  for (const { init, display_name } of Object.values(require("clients"))) {
    if (init) {
      console.log(clfdate(), `Initializing ${display_name} client`);
      init();
    }
  }

  if (process.env.FAST !== "true") {
    // Fork workers based on how many CPUs are available
    for (let i = 0; i < NUMBER_OF_WORKERS; i++) {
      cluster.fork();
    }
  } else {
    // In FAST mode, just fork one
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    if (worker.exitedAfterDisconnect === false) {
      console.log(clfdate(), "Worker died unexpectedly, starting a new one");
      cluster.fork();
      email.WORKER_ERROR();
      // worker processes can have scheduled tasks to publish
      // scheduled entries in future – if the worker dies it's
      // important the master process instead schedules the task
      // todo: make it so that workers can ask the master
      // process to deal with publication scheduling...
      publishScheduledEntries();
    }
  });

  // SIGUSR1 is used by node for debugging, so we use SIGUSR2 to
  // signal the master process that it's time to reboot the servers
  process.on("SIGUSR2", function () {
    let workerIDs = Object.keys(cluster.workers);
    let totalWorkers = workerIDs.length;

    console.log(
      clfdate(),
      `Recieved signal to replace ${totalWorkers} workers`
    );

    async.eachSeries(
      workerIDs,
      function (workerID, next) {
        let worker;
        let workerIndex = workerIDs.indexOf(workerID) + 1;
        let replacementWorker;
        let timeout;

        console.log(
          clfdate(),
          `Replacing worker ${workerIndex}/${totalWorkers}`
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
            `Replaced worker ${workerIndex}/${totalWorkers}`
          );
          workerID++;
          next();
        });
      },
      function () {
        console.log(clfdate(), `Replaced all workers`);
        // worker processes can have scheduled tasks to publish
        // scheduled entries in future – if the worker dies it's
        // important the master process instead schedules the task
        // todo: make it so that workers can ask the master
        // process to deal with publication scheduling...
        publishScheduledEntries();
      }
    );
  });

  // In development mode we sometimes want to run
  // just the dashboard, since the server boot is slow
  // Remove once we get the server online faster
  if (process.env.FAST !== "true") {
    // Launch scheduler for background tasks, like backups, emails
    scheduler();
  }
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
