// Redis client with default configuration
var client = require("client");

// Stores the source folder for a given blog against
// the blog's ID. We need to be able to list all
// blogs when the server starts so that we can
// begin watching those folders for changes.
module.exports = {
  get: function(blogID, callback) {
    client.get("blog:" + blogID + ":local:folder", callback);
  },

  list: function(callback) {
    client.smembers("clients:local:blogs", callback);
  },

  set: function(blogID, folder, callback) {
    var multi = client.multi();
    multi.set("blog:" + blogID + ":local:folder", folder);
    multi.sadd("clients:local:blogs", blogID);
    multi.exec(callback);
  },

  unset: function(blogID, callback) {
    var multi = client.multi();
    multi.del("blog:" + blogID + ":local:folder");
    multi.srem("clients:local:blogs", blogID);
    multi.exec(callback);
  }
};
