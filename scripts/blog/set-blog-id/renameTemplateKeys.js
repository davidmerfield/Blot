var client = require("client");
var Keys = require("../../redis/keys");

module.exports = function renameTransformerIDs(oldBlogID, newBlogID, callback) {
  var multi = client.multi();

  multi.rename(
    "template:owned_by:" + oldBlogID,
    "template:owned_by:" + newBlogID
  );

  Keys("template:" + oldBlogID + ":*", function(err, keys) {
    keys.forEach(function(key) {
      multi.RENAMENX(
        key,
        key
          .split("template:" + oldBlogID + ":")
          .join("template:" + newBlogID + ":")
      );
    });

    multi.exec(callback);
  });
};
