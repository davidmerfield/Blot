var redis = require("redis").createClient();

redis.keys("image:dimensions:*", function (error, sessionKeys) {
  sessionKeys.forEach(function (sessionKey) {
    console.log("Deleting: " + sessionKey);

    redis.del(sessionKey);
  });

  countKeys("image:dimensions:*");
});

function count(key) {
  redis.keys(key, function (error, keys) {
    console.log(key + " keys number: " + keys.length);
  });
}

function countKeys() {
  count("*");
  console.log("-------");
}
