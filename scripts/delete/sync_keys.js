var redis = require("redis").createClient();
var forEach = require("helper/forEach");

var SCHEMES = [
  "blog:*:sync:queue",
  "blog:*:sync:active",
  "blog:*:sync:warning",
  "blog:*:sync:error",
];

forEach(
  SCHEMES,
  function (SCHEME, next) {
    console.log("DEL", SCHEME);

    count(SCHEME);

    redis.keys(SCHEME, function (err, keys) {
      if (err) throw err;

      if (!keys || !keys.length) return next();

      redis.del(keys, function (err) {
        if (err) throw err;

        count(SCHEME);
        next();
      });
    });
  },
  process.exit
);

function count(key) {
  redis.keys(key, function (error, keys) {
    console.log(key + " keys number: " + keys.length);
  });
}
