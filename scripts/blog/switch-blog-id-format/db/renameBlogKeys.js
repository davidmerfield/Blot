var client = require("client");
var async = require("async");
var debug = require("debug")("blot:scripts:set-blog-id:db:renameBlogKeys");

module.exports = function renameBlogKeys(
  keys,
  multi,
  oldBlogID,
  newBlogID,
  callback
) {
  keys = keys.filter(function(key) {
    return key.indexOf("blog:" + oldBlogID + ":") === 0;
  });

  debug(keys);

  function replaceIDInKey(key) {
    return key.split("blog:" + oldBlogID + ":").join("blog:" + newBlogID + ":");
  }

  function isASetKey(key) {
    return (
      key.indexOf("blog:" + oldBlogID + ":folder:") === 0 ||
      (key.indexOf("blog:" + oldBlogID + ":store:") === 0 &&
        key.indexOf(":everything") > -1)
    );
  }

  async.each(
    keys,
    function(key, next) {
      if (!isASetKey(key)) return next();

      client.smembers(key, function(err, members) {
        if (err) return next();

        members.forEach(function(member) {
          multi.srem(key, member);
          multi.sadd(key, replaceIDInKey(member));
        });

        next();
      });
    },
    function(err) {
      keys.forEach(function(key) {
        multi.RENAMENX(key, replaceIDInKey(key));
      });
      callback();
    }
  );
};
