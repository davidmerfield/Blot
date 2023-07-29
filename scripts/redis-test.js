var config = require("config");
var redis = require("redis");

var clientA = redis.createClient(config.redis.port);

clientA.on("error", function (err) {
  console.log("Redis Error:");
  console.log(err);
  if (err.trace) console.log(err.trace);
  if (err.stack) console.log(err.stack);
});

clientA.ping(function (err, reply) {
  if (err) throw err;
  console.log("A: " + reply);
});

const remoteRedisURL = "redis://" + process.argv[2] + ":6379";

console.log("remoteRedisURL", remoteRedisURL);

var clientB = redis.createClient(remoteRedisURL);

clientB.on("error", function (err) {
  console.log("Redis Error:");
  console.log(err);
  if (err.trace) console.log(err.trace);
  if (err.stack) console.log(err.stack);
});

clientB.ping(function (err, reply) {
  if (err) throw err;
  console.log("B: " + reply);
});
