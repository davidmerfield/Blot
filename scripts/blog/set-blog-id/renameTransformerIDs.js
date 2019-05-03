var async = require("async");
var client = require("client");
var keys = require("../../redis/keys");

module.exports = function renameTransformerIDs(oldBlog, newBlogID, callback) {
  // there are keys in the transformer which contain a set of other keys
  // containing the old blog ID, we need to modify those keys

  keys("blog:" + newBlogID + ":store:*:everything", function(err, sets) {
    var multi = client.multi();

    async.each(
      sets,
      function(set, next) {
        client.smembers(set, function(err, keys) {
          if (err) return next(err);

          keys.forEach(function(key) {
            var newKey = key
              .split("blog:" + oldBlog.id + ":")
              .join("blog:" + newBlogID + ":");

            multi.srem(set, key);
            multi.sadd(set, newKey);
          });

          next();
        });
      },
      function(err) {
        if (err) return callback(err);

        multi.exec(callback);
      }
    );
  });
};
