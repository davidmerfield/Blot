var client = require("redis").createClient();
var colors = require("colors/safe");

if (require.main === module) {
  let keys = [];
  redisKeys(
    process.argv[2],
    function (_keys, next) {
      keys = keys.concat(_keys);
      next();
    },
    function () {
      console.log();
      console.log(keys);
      process.exit();
    }
  );
}

function redisKeys(pattern, fn, callback) {
  var complete;
  var cursor = "0";
  client.dbsize(function (err, total) {
    if (err) return callback(err);
    var processed = 0;
    var totalLen = total.toString().length;
    client.scan(cursor, "match", pattern, "count", 1000, function then(
      err,
      res
    ) {
      if (err) return callback(err);
      cursor = res[0];
      fn(res[1], function (err) {
        if (err) return callback(err);
        processed += res[1].length;
        complete = cursor === "0";
        if (complete) {
          callback(err);
        } else {
          process.stdout.write(
            pad(Math.floor((processed / total) * 100), 3, " ") +
              "% " +
              colors.dim(pad(processed, totalLen) + "/" + total + "\r")
          );
          client.scan(cursor, "match", pattern, "count", 1000, then);
        }
      });
    });
  });
}

function pad(x, len, str) {
  x = x.toString();
  while (x.length < len) x = (str || "0") + x;
  return x;
}

module.exports = redisKeys;
