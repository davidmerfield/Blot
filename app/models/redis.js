var config = require("config");
var redis = require("redis");

module.exports = function () {
    var client = redis.createClient(config.redis.port);

    client.on("error", function (err) {
      console.log("Redis Error:");
      console.log(err);
      if (err.trace) console.log(err.trace);
      if (err.stack) console.log(err.stack);
    });
    
    return client;
}