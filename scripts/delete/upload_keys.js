var redis = require("redis").createClient();
var blogID = process.argv[2];

if (!blogID) throw "Please specify a blog id";

var SCHEME = "blog:" + blogID + ":upload:*";

console.log(SCHEME);

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
