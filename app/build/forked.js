const prefix = () => clfdate() + " build";
const debug = require("debug")("blot:build");
const uuid = require("uuid/v4");
const child_process = require("child_process");
const clfdate = require("helper/clfdate");
const jobs = {};

let worker = new Worker();

// Does this handle the cluster reload action too?
// e.g. scripts/reload-server.sh?
process.on("exit", function () {
  worker.kill();
});

module.exports = function (blog, path, options, callback) {
  const jobId = "job_" + uuid();
  jobs[jobId] = {
    blog,
    jobId,
    path,
    options,
    callback
  };

  worker.send({ blog, path, jobId, options }, function (err) {
    if (err) {
      console.log(prefix(), `failed to send job overseer=${process.pid}`, err);
      return callback(new Error("Failed to build"));
    }
    console.log(
      prefix(),
      `master=${process.pid} worker=${worker.pid} ${jobId.slice(0, 12)} sent`
    );
  });
};

function Worker () {
  console.log(prefix(), `master=${process.pid} launched`);
  const newWorker = child_process.fork(__dirname + "/main", {
    detached: false
  });

  newWorker.on("message", function ({ err, jobId, entry }) {
    var job = jobs[jobId];

    console.log(
      prefix(),
      `master=${process.pid} worker=${worker.pid} ${jobId.slice(
        0,
        12
      )} completed error=${!!err}`
    );

    if (job) {
      delete jobs[jobId];
    }

    if (job.callback) {
      job.callback(err, entry);
    }
  });

  newWorker.on("exit", function (code) {
    if (code !== 0) worker = new Worker();

    console.log(
      prefix(),
      `Overseer pid=${process.pid} has a dead build process`
    );

    for (const jobId in jobs) {
      const job = jobs[jobId];
      job.callback(new Error("Failed to finish task"));
      delete jobs[jobId];
    }
  });

  return newWorker;
}
