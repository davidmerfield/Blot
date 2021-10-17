var debug = require("debug")("blot:build");
var uuid = require("uuid/v4");
var child_process = require("child_process");
var clfdate = require("helper/clfdate");
var jobs = {};

const prefix = () => clfdate() + " Build:";

var worker = new Worker();

module.exports = function (blog, path, options, callback) {
  const jobId = uuid();
  jobs[jobId] = {
    blog,
    jobId,
    path,
    options,
    callback,
  };

  worker.send({ blog, path, jobId, options }, function (err) {
    if (err) {
      console.log(prefix(), `failed to send job overseer=${process.pid}`, err);
      return callback(new Error("Failed to build"));
    }
    console.log(
      prefix(),
      `sent job overseer=${process.pid} worker=${worker.pid}`
    );
  });
};

function Worker() {
  console.log(prefix(), `Launching new build worker overseer=${process.pid}`);
  const newWorker = child_process.fork(__dirname + "/main", {
    detached: false,
  });
  newWorker.on("message", function ({ err, jobId, entry }) {
    var job = jobs[jobId];

    console.log(prefix(), `completed jobId=${jobId} error=${!!err}`);

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
