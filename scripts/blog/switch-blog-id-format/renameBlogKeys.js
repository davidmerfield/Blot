var Keys = require("../../redis/keys");
var client = require("client");
var async = require("async");

module.exports = function renameBlogKeys(oldBlogID, newBlogID, callback) {
  var renameMulti = client.multi();
  var setMulti = client.multi();

  setMulti.sadd("blogs", newBlogID);
  setMulti.srem("blogs", oldBlogID);

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

  Keys("blog:" + oldBlogID + ":*", function(err, keys) {
    if (err) return callback(err);
    async.each(
      keys,
      function(key, next) {
        renameMulti.RENAMENX(key, replaceIDInKey(key));

        if (!isASetKey(key)) return next();

        client.smembers(key, function(err, members) {
          if (err) return next();

          members.forEach(function(member) {
            setMulti.srem(key, member);
            setMulti.sadd(key, replaceIDInKey(member));
          });

          next();
        });
      },
      function(err) {
        if (err) return callback(err);
        setMulti.exec(function(err) {
          if (err) return callback(err);
          renameMulti.exec(callback);
        });
      }
    );
  });
};
