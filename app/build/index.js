// Launch queue to process the building of entries
const bull = require("bull");
const queue = new bull("build");

queue.process(__dirname + "/main.js");

module.exports = async function (blog, path, options, callback) {
  try {
    const job = await queue.add({ blog, path, options });
    const result = await job.finished();
    return callback(null, result);
  } catch (e) {
    return callback(e);
  }
};
