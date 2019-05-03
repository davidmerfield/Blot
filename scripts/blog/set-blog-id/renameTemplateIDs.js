var client = require("client");

module.exports = function renameTemplateIDs(oldBlog, newBlogID, callback) {
  var multi = client.multi();

  client.smembers("template:owned_by:" + newBlogID, function(
    err,
    oldTemplateIDs
  ) {
    oldTemplateIDs.forEach(function(oldTemplateID) {
      var newTemplateID = oldTemplateID
        .split(oldBlog.id + ":")
        .join(newBlogID + ":");

      multi.srem("template:owned_by:" + newBlogID, oldTemplateID);
      multi.sadd("template:owned_by:" + newBlogID, newTemplateID);

      multi.hset("template:" + newTemplateID + ":info", "owner", newBlogID);
      multi.hset("template:" + newTemplateID + ":info", "id", newTemplateID);
    });

    multi.exec(callback);
  });
};
