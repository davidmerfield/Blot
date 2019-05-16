var Keys = require("helper").redisKeys;
var client = require("client");
var async = require("async");

module.exports = function renameHandleKeys(oldBlogID, newBlogID, callback) {
  var multi = client.multi();

  Keys("handle:*", function(err, keys) {
    async.each(
      keys,
      function(key, next) {
        client.get(key, function(err, id) {
          if (err) return next(err);

          if (id === oldBlogID) multi.set(key, newBlogID);

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
