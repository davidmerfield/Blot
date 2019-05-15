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

    multi.exec(function(err) {
      if (err) return callback(err);

      multi = client.multi();

      client.smembers("template:owned_by:" + newBlogID, function(
        err,
        oldTemplateIDs
      ) {
        oldTemplateIDs.forEach(function(oldTemplateID) {
          var newTemplateID = oldTemplateID
            .split(oldBlogID + ":")
            .join(newBlogID + ":");

          multi.srem("template:owned_by:" + newBlogID, oldTemplateID);
          multi.sadd("template:owned_by:" + newBlogID, newTemplateID);

          multi.hset("template:" + newTemplateID + ":info", "owner", newBlogID);
          multi.hset(
            "template:" + newTemplateID + ":info",
            "id",
            newTemplateID
          );
        });

        multi.exec(callback);
      });
    });
  });
};
