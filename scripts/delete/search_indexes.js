require("../only_locally");

var redis = require("redis").createClient();

var SCHEME = "blog:*:search*";

count(SCHEME);

redis.keys(SCHEME, function (err, keys) {
  if (err) throw err;

  if (!keys || !keys.length) return;

  redis.del(keys, function (err) {
    if (err) throw err;

    count(SCHEME);
  });
});

function count(key) {
  redis.keys(key, function (error, keys) {
    console.log(key + " keys number: " + keys.length);
  });
}
