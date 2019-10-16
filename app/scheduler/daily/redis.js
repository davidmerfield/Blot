var client = require("client");
var config = require("config");
var prettySize = require("helper").prettySize;

function main(callback) {
  client.info(function(err, usage) {
    if (err) return callback(err);

    usage = usage.slice(usage.indexOf("used_memory:") + "used_memory:".length);
    usage = usage.slice(0, usage.indexOf("\n"));
    // redis uses bytes but the prettySize library wants kb
    usage = prettySize(usage / 1000);

    client.config("get", "maxmemory", function(err, limit) {
      if (err) return callback(err);
      limit = parseInt(limit[1]);
      // redis uses bytes but the prettySize library wants kb
      limit = prettySize(limit / 1000);

      callback(null, {
        redis_memory_usage: usage,
        redis_memory_limit: limit
      });
    });
  });
}

module.exports = main;

if (require.main === module) require("./cli")(main);
