var Keys = require("../../redis/keys");
var client = require("client");

module.exports = function renameBlogKeys(oldBlogID, newBlogID, callback) {
  var multi = client.multi();

  multi.sadd("blogs", newBlogID);
  multi.srem("blogs", oldBlogID);

  Keys("blog:" + oldBlogID + ":*", function(err, keys) {
    keys.forEach(function(key) {
      multi.RENAMENX(
        key,
        key.split("blog:" + oldBlogID + ":").join("blog:" + newBlogID + ":")
      );
    });

    multi.exec(callback);
  });
};
