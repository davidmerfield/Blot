var client = require("../../app/models/client");
var redisKeys = require("helper").redisKeys;
var Blog = require("../../app/models/blog");
var async = require("async");

if (Blog.key.ids !== "blogs")
  throw new Error("There is no set to add the blog IDs to");

// keys is safe to run in production, I rewrote
// the SSCAN method so it works like KEYS
redisKeys("blog:*:info", function(err, keys) {
  if (err) throw err;

  async.each(
    keys,
    function(key, next) {
      client.HGETALL(key, function(err, blog) {
        if (err) {
          console.log("ERROR hgetall", key, err);
          return next();
        }

        if (!blog || !blog.id) {
          console.log("No blog", key);
          return next();
        }

        if (key !== "blog:" + blog.id + ":info")
          return next(
            new Error("ID mismatch: " + key + " and blog.id " + blog.id)
          );

        client.SISMEMBER(Blog.key.ids, blog.id, function(err, member) {
          if (err) return next(err);

          if (member) {
            return next();
          } else {
            console.log(blog.id, "Adding to set '" + Blog.key.ids + "'");
            client.SADD(Blog.key.ids, blog.id, next);
          }
        });
      });
    },
    function(err) {
      if (err) throw err;

      client.smembers(Blog.key.ids, function(err, members) {
        if (err) throw err;
        console.log(
          "Done! blog:*:info keys: " +
            keys.length +
            "   blog set members: " +
            members.length
        );
        process.exit();
      });
    }
  );
});
