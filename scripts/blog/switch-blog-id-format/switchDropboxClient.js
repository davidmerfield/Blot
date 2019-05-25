var debug = require("debug")("blot:scripts:set-blog-id:switchDropboxClient");
var client = require("client");
var colors = require("colors/safe");

module.exports = function switchDropboxClient(oldBlogID, newBlogID, callback) {
  console.log(colors.dim("Blog: " + oldBlogID) + " Switching Dropbox client");

  // Redis Hash which stores the Dropbox account info
  client.hgetall("blog:" + oldBlogID + ":dropbox:account", function(err, keys) {
    if (err) return callback(err);

    if (!keys || !keys.account_id) {
      debug(oldBlogID, "was not configured to use the Dropbox client");
      return callback();
    }

    // Redis set whoses members are the blog IDs
    // connected to this dropbox account.
    client.smembers("clients:dropbox:" + keys.account_id, function(
      err,
      members
    ) {
      if (err) return callback(err);

      if (!members) return callback(new Error("No members"));

      if (members.indexOf(oldBlogID) === -1) return callback();

      client
        .multi()
        .srem("clients:dropbox:" + keys.account_id, oldBlogID)
        .sadd("clients:dropbox:" + keys.account_id, newBlogID)
        .exec(callback);
    });
  });
};
