var client = require("client");
var async = require("async");

module.exports = function renameHandleKeys(
  keys,
  multi,
  oldBlogID,
  newBlogID,
  callback
) {
  keys = keys.filter(function(key) {
    return key.indexOf("handle:") === 0;
  });

  async.each(
    keys,
    function(key, next) {
      client.get(key, function(err, id) {
        if (err || id !== oldBlogID) return next(err);

        multi.set(key, newBlogID);
        next();
      });
    },
    callback
  );
};
