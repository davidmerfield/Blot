var debug = require("debug")("blot:models:entry:build");
var cp = require("child_process");
var crypto = require("crypto");
var exitHook = require("async-exit-hook");

var worker = new Worker();

// Make sure we remove the workers when the main
// process is killed to avoid zombie processes
exitHook(function() {
  console.log("Master: shutting down worker process", worker.pid);
  worker.kill();
});

// This purpose of this file is to insulate the main thread from the
// risky and resource intensive process of building a blog post from
// a source file. This is done with the aim of keeping the main web
// server responsive, since some of the function inside the build process
// run synchronously.
module.exports = function(blog, path, callback) {
  var buildID = crypto.randomBytes(32).toString("hex");

  function exitHandler() {
    callback(new Error("Failed to build " + buildID + " as worked is dead."));
  }

  function messageHandler(response) {
    // Filter out other build messages
    if (response.buildID !== buildID) return;

    // Since the worker did not die during the build
    // we can remove the listener. Otherwise a future
    // death will trigger the callback!
    worker.removeListener("exit", exitHandler);
    worker.removeListener("message", messageHandler);

    callback(response.err, response.entry);
  }

  var message = { blog: blog, path: path, buildID: buildID };

  // Ensure we invoke the callback if the worker dies
  worker.on("exit", exitHandler);
  worker.on("message", messageHandler);

  debug(
    "Blog:",
    blog.id,
    path,
    " sending to worker process with build id",
    buildID
  );

  worker.send(message);
};

// what happens if worker errors or shuts down?
// can we have multiple workers?
function Worker() {
  var child;

  console.log("Master: starting first worker process");
  child = cp.fork(__dirname + "/main.js");

  child.on("exit", function(code) {
    if (code === 0) {
      console.log("Master: no re-starting of worker process");
      return;
    }

    console.log("Master: re-starting worker process");
    worker = new Worker();
  });

  return child;
}
