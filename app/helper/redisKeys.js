var client = require("redis").createClient();

module.exports = function redisKeys(pattern, callback) {
  var keys = [];
  var complete;
  var cursor = "0";

  client.scan(cursor, "match", pattern, "count", 1000, function then(err, res) {
    if (err) return callback(err);

    cursor = res[0];
    keys = keys.concat(res[1]);
    complete = cursor === "0";

    if (complete) {
      callback(err, keys);
    } else {
      client.scan(cursor, "match", pattern, "count", 1000, then);
    }
  });
};
