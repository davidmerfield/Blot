var config = require("config");
const { ConsoleReporter } = require("jasmine");
var redis = require("redis");

var clientA = redis.createClient(config.redis.port);

clientA.on("error", function (err) {
  console.log("Redis Error:");
  console.log(err);
  if (err.trace) console.log(err.trace);
  if (err.stack) console.log(err.stack);
});

console.time("clientA.ping");
clientA.ping(function (err, reply) {
  if (err) throw err;
  console.timeEnd("clientA.ping");
  console.log("A: " + reply);
});

const remoteRedisURL = "redis://" + process.argv[2] + ":6379";

console.log("remoteRedisURL", remoteRedisURL);

var clientB = redis.createClient({ url: remoteRedisURL });

clientB.on("error", function (err) {
  console.log("Redis Error:");
  console.log(err);
  if (err.trace) console.log(err.trace);
  if (err.stack) console.log(err.stack);
});

console.time("clientB.ping");
clientB.ping(function (err, reply) {
  if (err) throw err;
  console.timeEnd("clientB.ping");
  console.log("B: " + reply);
});
