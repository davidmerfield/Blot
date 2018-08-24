var cp = require("child_process");
var worker = new Worker();
var crypto = require("crypto");

// what happens if worker errors or shuts down?
// can we have multiple workers?

function Worker () {
  return cp.fork(__dirname + "/main.js");
}

module.exports = function(blog, path, callback) {
  
  var buildID = crypto.randomBytes(32).toString("hex");

  console.log(buildID, 'sending', path, 'to worker process');

  worker.send({ blog: blog, path: path, buildID: buildID });

  worker.on('exit', onExit);

  function onExit (code){

    if (code === 0) return;

    // tell master
    // we need to release pending callbacks...
    callback(new Error('Failed to build ' + path));

    console.log('worker has exited the building');
    worker = new Worker();
    console.log('started new worker...');
  }

  worker.on("message", function(message) {
      
    if (message.buildID !== buildID) return;

    worker.removeListener('exit', onExit);
    callback(message.err, message.entry);
  });
};
