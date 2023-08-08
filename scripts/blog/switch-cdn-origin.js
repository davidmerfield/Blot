const each = require("../each/blog");

const OLD_ORIGIN = "https://blotcdn.com/";
const NEW_ORIGIN = "https://cdn.blot.im/";


const keys = require("../db/keys");
const get = require("../get/blog");
const client = require("client");

const async = require("async");
const { cache } = require("../../config");

main(function (err) {
  if (err) throw err;

  console.log("Done!");
  process.exit();
});

function main(callback) {

  const searchParam = "*blog:blog_*";

  console.log("searching '" + searchParam + "'");

  keys(
    searchParam,
    function (keys, next) {
      if (!keys.length) return next();

      const multi = client.multi();

      // For each key in series
      async.eachSeries(
        keys,
        function (key, next) {
          client.type(key, function (err, type) {
            if (err) return next(err);

            if (type === "string") {
              client.get(key, function (err, value) {
                if (err) return next(err);

                if (value.indexOf(OLD_ORIGIN) > -1) {
                  console.log("Modifying STRING", key);
                  value = value.split(OLD_ORIGIN).join(NEW_ORIGIN);
                  multi.set(key, value);
                }

                next();
              });
            } else if (type === "hash") {
              client.hgetall(key, function (err, value) {
                if (err) return next(err);

                Object.keys(value).forEach(function (hashKey) {
                  try {
                    let hashValue = value[hashKey];
                    if (hashValue.indexOf(OLD_ORIGIN) > -1) {
                      console.log("Modifying HASH", key, hashKey);
                      hashValue = hashValue.split(OLD_ORIGIN).join(NEW_ORIGIN);
                      multi.hset(key, hashKey, hashValue);
                    }
                  } catch (e) {
                    console.log("error handling", key, hashKey, value[hashKey]);
                    throw e;
                  }
                });

                next();
              });
            } else {
              next();
            }
          });
        },
        (err) => {
          if (!multi.queue.length) {
            return next();
          }
    
          multi.exec(next);
        }
      );
    },
    callback
  );
}
