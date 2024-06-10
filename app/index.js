const cluster = require("cluster");
const config = require("config");

if (cluster.isMaster) {
  const async = require("async");
  const fs = require("fs-extra");
  const clfdate = require("helper/clfdate");
  const notify = require("helper/systemd-notify");

  const NUMBER_OF_CORES = require("os").cpus().length;

  const NUMBER_OF_WORKERS =
    NUMBER_OF_CORES > 4
      ? Math.round(NUMBER_OF_CORES / 2)
      : 2;

  const publishScheduledEntries = require("./scheduler/publish-scheduled-entries");

  console.log(
    clfdate(),
    `Starting pid=${process.pid} environment=${config.environment} workers=${NUMBER_OF_WORKERS}`
  );

  // Write the master process PID so we can signal it
  fs.outputFileSync(config.pidfile, process.pid.toString(), "utf-8");

  // Fork workers based on how many CPUs are available
  for (let i = 0; i < NUMBER_OF_WORKERS; i++) {
    cluster.fork();
  }

  const email = require("helper/email");

  // It's important that this only runs once and 'listening'
  // will fire when each worker comes online
  cluster.once("listening", () => {
    const scheduler = require("./scheduler");
    const setup = require("./setup");

    email.SERVER_START();

    setup(async err => {
      if (err) throw err;

      console.log(clfdate(), "Finished setting up");

      // Launch scheduler for background tasks, like backups, emails
      scheduler();

      // Run any initialization that clients need
      // Google Drive will renew any webhooks, e.g.
      for (const { init, display_name } of Object.values(require("clients"))) {
        if (init) {
          console.log(clfdate(), display_name + " client:", "Initializing");
          init();
        }
      }

      notify({ ready: true, status: "Node server ready" });

      setInterval(() => {
        notify({
          status: `Node server running ${
            Object.keys(cluster.workers).length
          } workers at ${new Date().toISOString()}}`
        });
      }, 1000 * 10); // every 10 seconds
    });
  });

  cluster.on("exit", worker => {
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
} else {
  const clfdate = require("helper/clfdate");

  console.log(clfdate(), `Worker process running pid=${process.pid}`);

  const server = require("./server");

  // Open the server to handle requests
  server.listen(config.port, function () {
    console.log(
      clfdate(),
      `Worker process listening pid=${process.pid} port=${config.port}`
    );
  });
}
