const queueID = process.argv[2];
const seed = process.argv[3];
const seedrandom = require("seedrandom")(seed, { global: true });
const Queue = require("../../index");
const queue = new Queue({ prefix: queueID });

queue.process(function (blogID, task, callback) {
  let WillDie = Math.round(Math.random()) === 0;

  const label = `WillDie=${WillDie} Worker=${
    process.pid
  } Queue=${queueID} Task=${JSON.stringify(task)}`;

  console.log(label);

  setTimeout(() => {
    if (WillDie) {
      throw new Error(label + " Unexpected error in test worker process!");
    } else {
      callback();
    }
  }, 100);
});

// I couldn't get process.send working so this
// tells the parent process the worker is online.
console.log("ready");
