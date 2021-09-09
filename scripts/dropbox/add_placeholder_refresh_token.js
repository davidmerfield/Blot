const Keys = require("../db/keys");
const client = require("client");
const async = require("async");

// migration to handle the new refresh tokens required by Dropbox

Keys(
  "blog:blog_*:dropbox:account",
  (keys, next) => {
    if (!keys.length) return next();

    async.eachSeries(
      keys,
      (key, next) => {
        client.type(key, (err, type) => {
          if (err) return next(err);
          if (type !== "hash") return next();
          client.hget(key, "refresh_token", (err, existingRefreshToken) => {
            if (err) return next(err);
            if (existingRefreshToken) return next();
            client.hset(key, "refresh_token", "", (err, stat) => {
              if (err) return next(err);
              if (stat) console.log(`. set refresh_token for ${key}`);
              next();
            });
          });
        });
      },
      next
    );
  },
  (err) => {
    if (err) throw err;
    console.log(`Checked all Dropbox accounts.`);
    process.exit();
  }
);
