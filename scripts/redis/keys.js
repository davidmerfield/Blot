var client = require("redis").createClient();

if (require.main === module) {
  var pattern = process.argv[2];

  if (pattern) {
    keys(pattern, function(err, keys) {
      if (err) throw err;
      if (keys.length) console.log(keys);
      console.log("Search complete! " + keys.length + " results found");
      process.exit();
    });
  } else {
    console.log(
      "This script offers a similar interface to Redis' KEYS command but is safe to use in production. Note that you must wrap your pattern in quotes to preserve the * character."
    );
    console.log('node scripts/redis/keys "your:*:search-pattern"');
  }
}

function keys(pattern, callback) {
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
}

module.exports = keys;
