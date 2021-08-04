const queueID = process.argv[2];
const Queue = require("../../index");
const queue = new Queue({ prefix: queueID });

console.log("processing ready!");
queue.process(function (blogID, task, callback) {
  const label = `Worker=${process.pid} Queue=${queueID} Task=${JSON.stringify(
    task
  )}`;

  console.log(label, "Started");
  setTimeout(function () {
    console.log(label, "Completed");
    callback();
  }, 100);
});
