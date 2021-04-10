var get = require("../blog/get");
var async = require("async");
var redis = require("redis").createClient();
var User = require("models/user");
var Blog = require("models/blog");

// Use this via the command line
if (require.main === module) {
  get(process.argv[2], function (user, blog) {
    main(blog.id, process.exit);
  });
}

function main(blogID, callback) {
  // this also needs to delete files from s3
  // this also needs to delete files on disk

  Blog.get({ id: blogID }, function (err, blog) {
    if (err) throw err;

    if (!blog) throw "No blog";

    var schemes = [
      "template:" + blog.id + ":*",
      "template:owned_by:" + blog.id,
      "blog:" + blog.id + ":*",
      "handle:" + blog.handle,
    ];

    User.getBy({ uid: blog.owner }, function (err, user) {
      if (err) throw err;

      if (!user) throw "No user";

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
          // Remove this blog from the list of blogs owned
          // by the user...
          user.blogs.splice(user.blogs.indexOf(blog.id), 1);

          User.set(user.uid, { blogs: user.blogs }, function (err) {
            if (err) throw err;

            console.log("Deleted this blog");

            callback();
          });
        }
      );
    });
  });
}

module.exports = main;
