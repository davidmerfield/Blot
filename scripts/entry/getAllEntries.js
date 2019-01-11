var redis = require("redis").createClient();
var async = require("async");

module.exports = function(blogID, callback) {
  var args = ["0", "MATCH", "blog:" + blogID + ":entry:*", "COUNT", 1000];
  var entryKeys = [];

  redis.scan(args, function then(err, res) {
    if (err) throw err;

    // the cursor for the next pass
    args[0] = res[0];

    // Append the keys we matched in the last pass
    entryKeys = entryKeys.concat(res[1]);

    // There are more keys to check, so keep going
    if (res[0] !== "0") return redis.scan(args, then);

    async.map(
      entryKeys,
      function(entry, next) {
        redis.get(entry, function(err, entry) {
          if (err) return next(err);

          next(null, JSON.parse(entry));
        });
      },
      callback
    );
  });
};
