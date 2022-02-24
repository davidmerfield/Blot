// Launch queue to process the building of entries
const bull = require("bull");
const buildQueue = new bull("build");

buildQueue.process(require("helper/rootDir") + "/app/build/main.js");

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
