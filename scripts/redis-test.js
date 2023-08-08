var config = require("config");
var redis = require("redis");

var clientA = redis.createClient(config.redis.port);

clientA.on("error", function (err) {
  console.log("local Redis Error:");
  console.log(err);
  if (err.trace) console.log(err.trace);
  if (err.stack) console.log(err.stack);
});

console.time("localRedis.ping");
clientA.ping(function (err, reply) {
  if (err) throw err;
  console.timeEnd("localRedis.ping");
  console.log("localRedis: " + reply);
});

const remoteRedisURL = "redis://" + process.argv[2] + ":6379";

console.log("remoteRedisURL", remoteRedisURL);

var clientB = redis.createClient({ url: remoteRedisURL });

clientB.on("error", function (err) {
  console.log("remoteRedis Error:");
  console.log(err);
  if (err.trace) console.log(err.trace);
  if (err.stack) console.log(err.stack);
});

console.time("remoteRedis.ping");
clientB.ping(function (err, reply) {
  if (err) throw err;
  console.timeEnd("remoteRedis.ping");
  console.log("remoteRedis: " + reply);
  clientB.info(function (err, reply) {
    if (err) throw err;
    console.log("remoteRedis:", reply);
  });
});
