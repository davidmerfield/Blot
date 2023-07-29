const OLD_ORIGIN = "https://blotcdn.com";
const NEW_ORIGIN = "https://cdn.blot.im";

const keys = require("../db/keys");
const get = require("../get/blog");
const client = require("client");

const async = require("async");

get(process.argv[2], function (err, user, blog) {
  if (err) throw err;

  keys("*" + blog.id + "*", function (keys) {
    console.log("Found " + keys.length + " keys associated with this blog");

    // For each key in series
    async.eachSeries(
      keys,
      function (key, next) {
        console.log("Checking key", key);
        client.type(key, function (err, type) {
          if (err) return next(err);

          if (type === "string") {
            client.get(key, function (err, value) {
              if (err) return next(err);

              if (value.indexOf(OLD_ORIGIN) > -1) {
                console.log("Found string key with old origin", key);
                console.log(value);
                next();
                //   value = value.replace(OLD_ORIGIN, NEW_ORIGIN);
                //   client.set(key, value, next);
              } else {
                next();
              }
            });
          } else if (type === "hash") {
            client.hgetall(key, function (err, value) {
              if (err) return next(err);

              Object.keys(value).forEach(function (hashKey) {
                const hashValue = value[hashKey];
                if (hashValue.indexOf(OLD_ORIGIN) > -1) {
                  console.log("Found hash key with old origin", key, hashKey);
                  console.log(hashValue);
                  //   value[hashKey] = hashValue.replace(OLD_ORIGIN, NEW_ORIGIN);
                  //   client.hset(key, hashKey, value[hashKey], next);
                  next();
                } else {
                  next();
                }
              });
            });
          } else {
            console.log("key", key, "is unsupported type: ", type);
            return next();
          }
        });
      },
      function (err) {
        if (err) throw err;

        console.log("Done!");
        process.exit();
      }
    );
  });
});
