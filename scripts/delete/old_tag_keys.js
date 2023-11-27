var redis = require("redis").createClient();

var TAGS = "blog:*:tags";
var TAG = "blog:*:tag:*";

drop(TAGS, function () {
  drop(TAG, function () {
    console.log("Done!");
    process.exit();
  });
});

function drop(scheme, cb) {
  count(scheme, function () {
    redis.keys(scheme, function (err, keys) {
      if (err) throw err;

      if (!keys || !keys.length) return cb();

      redis.del(keys, function (err) {
        if (err) throw err;

        count(scheme, function () {
          cb();
        });
      });
    });
  });
}

function count(key, cb) {
  redis.keys(key, function (error, keys) {
    if (error) throw error;

    console.log(key + " keys number: " + keys.length);
    cb();
  });
}
