const each = require("../each/blog");

const OLD_ORIGIN = "https://blotcdn.com";
const NEW_ORIGIN = "https://cdn.blot.im";

const keys = require("../db/keys");
const get = require("../get/blog");
const client = require("client");

const async = require("async");
const e = require("express");

if (process.argv[2]) {
  get(process.argv[2], function (err, user, blog) {
    if (err) throw err;
    main(blog, function (err) {
      if (err) throw err;
      console.log("Processed!");
      process.exit();
    });
  });
} else {
  each(
    (user, blog, next) => {
      if (!blog) return next();
      if (blog.isDisabled) return next();
      main(blog, next);
    },
    (err) => {
      if (err) throw err;
      console.log("All blogs processed!");
      process.exit();
    }
  );
}

function main(blog, callback) {
  const searchParam = "*" + blog.id + "*";

  console.log("searching '" + searchParam + "'");

  keys(
    searchParam,
    function (keys, next) {
      if (!keys.length) return next();

      //   console.log("Found " + keys.length + " keys associated with this blog");

      // For each key in series
      async.eachSeries(
        keys,
        function (key, next) {
          //   console.log("Checking key", key);
          client.type(key, function (err, type) {
            if (err) return next(err);

            if (type === "string") {
              client.get(key, function (err, value) {
                if (err) return next(err);

                if (value.indexOf(OLD_ORIGIN) > -1) {
                  console.log("Modifying", key);
                  console.log(value);
                  value = value.split(OLD_ORIGIN).join(NEW_ORIGIN);
                  client.set(key, value, next);
                } else {
                  next();
                }
              });
            } else if (type === "hash") {
              client.hgetall(key, function (err, value) {
                if (err) return next(err);

                const multi = client.multi();
                let changes = false;

                Object.keys(value).forEach(function (hashKey) {
                  const hashValue = value[hashKey];
                  if (hashValue.indexOf(OLD_ORIGIN) > -1) {
                    console.log("Modifying", key, hashKey);
                    value[hashKey] = hashValue.replace(OLD_ORIGIN, NEW_ORIGIN);
                    changes = true;
                    multi.hset(key, hashKey, value[hashKey]);
                  }
                });

                if (changes) {
                  multi.exec(next);
                } else {
                  next();
                }
              });
            } else {
              //   console.log("key", key, "is unsupported type: ", type);
              next();
            }
          });
        },
        next
      );
    },
    callback
  );
}
