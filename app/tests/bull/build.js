const bull = require("bull");
var config = require("config");
var redis = require("redis");
var client = redis.createClient(config.redis.port);

client.on("error", function (err) {
  console.log("Redis Error:");
  console.log(err);
  if (err.trace) console.log(err.trace);
  if (err.stack) console.log(err.stack);
});
const queue = new bull("example", {
  createClient: function (type) {
    switch (type) {
      case "client":
        return client;
      case "subscriber":
        return client;
      default:
        return client;
    }
  },
});

queue.process(__dirname + "/worker.js");

module.exports = async function (data, callback) {
  try {
    const job = await queue.add(data);
    const result = await job.finished();
    return callback(null, result);
  } catch (e) {
    return callback(e);
  }
};
