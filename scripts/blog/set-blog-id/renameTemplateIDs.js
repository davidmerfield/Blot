var client = require("client");
var debug = require("debug")("blot:scripts:set-blog-id:renameTemplateIDs");

module.exports = function renameTemplateIDs(oldBlogID, newBlogID, callback) {
  debug("Renaming old template IDs for", oldBlogID);

  var multi = client.multi();

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
      multi.hset("template:" + newTemplateID + ":info", "id", newTemplateID);
    });

    multi.exec(callback);
  });
};
