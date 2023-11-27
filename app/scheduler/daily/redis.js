var client = require("models/client");
var prettySize = require("helper/prettySize");

function main(callback) {
  client.info(function (err, usage) {
    if (err) return callback(err);

    usage = usage.slice(usage.indexOf("used_memory:") + "used_memory:".length);
    usage = usage.slice(0, usage.indexOf("\n"));
    // redis uses bytes but the prettySize library wants kb
    usage = prettySize(usage / 1000);

    client.config("get", "maxmemory", function (err, limit) {
      if (err) return callback(err);
      limit = parseInt(limit[1]);
      var available = limit - usage;

      // redis uses bytes but the prettySize library wants kb
      callback(null, {
        redis_memory_available: prettySize(available / 1000),
        redis_memory_usage: prettySize(usage / 1000),
        redis_memory_limit: prettySize(limit / 1000),
      });
    });
  });
}

module.exports = main;

if (require.main === module) require("./cli")(main);
