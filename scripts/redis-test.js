var config = require("config");
var redis = require("redis");

var clientA = redis.createClient(config.redis.port);

const remoteRedisURL = "redis://" + process.argv[2] + ":6379";

console.log("remoteRedisURL", remoteRedisURL);

var clientB = redis.createClient(remoteRedisURL);

clientB.ping(function (err, reply) {
  if (err) throw err;
  console.log("B: " + reply);
});

clientA.ping(function (err, reply) {
  if (err) throw err;
  console.log("A: " + reply);
});
