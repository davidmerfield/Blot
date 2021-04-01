var get = require("../blog/get");
var async = require("async");
var redis = require("redis").createClient();

get(process.argv[2], function (user, blog) {
  console.log(user.name, blog.handle);

  // this also needs to delete files from s3
  // this also needs to delete files on disk

  if (!user.isDisabled)
    throw "This account is not disabled. Please disable it first";

  var schemes = [
    "user:" + user.uid + ":info",
    "customer:" + user.subscription.customer,
  ];

  async.eachSeries(
    user.blogs,
    function (blogID, next) {
      get(blogID, function (user, blog) {
        schemes = schemes.concat([
          "template:" + blogID + ":*",
          "template:owned_by:" + blogID,
          "blog:" + blogID + ":*",
          "handle:" + blog.handle,
        ]);

        next();
      });
    },
    function () {
      async.eachSeries(
        schemes,
        function (scheme, next) {
          console.log(scheme);

          redis.keys(scheme, function (err, keys) {
            if (err) throw err;

            console.log(".. deleting", keys.length, "keys.");

            if (!keys.length) return next();

            redis.del(keys, function (err) {
              if (err) throw err;

              console.log(".. deleted", keys.length, "keys.");
              next();
            });
          });
        },
        function () {
          console.log("Deleted this account");

          process.exit();
        }
      );
    }
  );
});
