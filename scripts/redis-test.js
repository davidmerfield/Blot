var config = require("config");
var redis = require("redis");

var clientA = redis.createClient(config.redis.port);

var clientB = redis.createClient("redis://" + process.argv[2] + ":6379");

clientB.ping(function (err, reply) {
  console.log("B: " + reply);
});

clientA.ping(function (err, reply) {
  console.log("A: " + reply);
});
