var client = require("client");
var generateID = require("../../../app/models/blog/generateID");
module.exports = function loadID(oldBlogID, callback) {
  client.get("switch-blog-id-format:" + oldBlogID, function(err, newBlogID) {
    if (err) return callback(err);
    newBlogID = newBlogID || generateID();

    client.set("switch-blog-id-format:" + oldBlogID, newBlogID, function(err) {
      if (err) return callback(err);
      callback(null, newBlogID);
    });
  });
};
