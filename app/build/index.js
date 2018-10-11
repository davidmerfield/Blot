var numCPUs = require("os").cpus().length;
var uuid = require("uuid/v4");
var exitHook = require("async-exit-hook");
var child_process = require("child_process");
var workers = [];
var jobs = {};

console.log("Master", process.pid, "is running");

exitHook(function() {
  console.log("Shutting down master:", process.pid);
  workers.forEach(function(item) {
    item.worker.kill();
  });
});

exitHook.uncaughtExceptionHandler(function(err) {
  console.error(err);
  workers.forEach(function(item) {
    item.worker.kill();
  });
});

function messageHandler(id) {
  return function(message) {
    jobs[message.id].callback(message.err, message.entry);
  };
}

// remove dead worker from list of workers
function removeWorker(id) {
  workers = workers.filter(function(item) {
    return item.id !== id;
  });
}

// From the docs:
// https://nodejs.org/api/child_process.html#child_process_event_error
// The 'error' event is emitted whenever:
// The process could not be spawned, or
// The process could not be killed, or
// Sending a message to the child process failed.
// The 'exit' event may or may not fire after an 
// error has occurred. When listening to both the 'exit'
// and 'error' events, it is important to guard against
// accidentally invoking handler functions multiple times.
function errorHandler(id) {
  return function(err) {
    // removeWorker can be safely called multiple times
    removeWorker(id);
  };
}

function closeHandler(id) {
  return function(code, signal) {
    removeWorker(id);

    // SIGINT, SIGTERM, etc.
    if (signal) {
      console.log("worker was killed by signal: ", signal);

      // typically means the process threw and error and had to stop.
    } else if (code !== 0) {
      console.log("worker exited with error code:", code);
      workers.push(new worker());
      // 0 Means the process exitted successfully.
      // Any other code
    } else {
      console.log("worker exitted success!");
    }
  };
}

// Fork workers.
for (let i = 0; i < numCPUs; i++) {
  workers.push(new worker());
}

function worker() {
  var wrkr = child_process.fork(__dirname + "/main");
  var id = uuid();
  console.log("creating worker", id);
  wrkr.on("error", errorHandler(id));
  wrkr.on("message", messageHandler(id));
  wrkr.on("close", closeHandler(id));
  return { worker: wrkr, id: id };
}

module.exports = function(blog, path, options, callback) {
  // Pick a worker at random from the pool
  var worker = workers[Math.floor(Math.random() * workers.length)].worker;
  var id = uuid();

  jobs[id] = {
    blog: blog,
    id: id,
    path: path,
    options: options,
    callback: callback
  };

  worker.send({ blog: blog, path: path, id: id, options: options });
};
