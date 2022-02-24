// Launch queue to process the building of entries
const bull = require("bull");
const buildQueue = new bull("build");

buildQueue.process(require("helper/rootDir") + "/app/build/main.js");

// process.on("SIGTERM", async () => {
//   console.log("Got SIGTERM");
//   setTimeout(() => {
//     console.warn(`Couldn't pause all queues within 30s, sorry! Exiting.`);
//     process.exit(1);
//   }, 30000);

//   await buildQueue.pause(true);
//   process.exit(0);
// });

module.exports = async function (blog, path, options, callback) {
  const job = await buildQueue.add({
    blog,
    path,
    options,
  });

  try {
    const entry = await job.finished();
    callback(null, entry);
  } catch (e) {
    callback(e);
  }
};
