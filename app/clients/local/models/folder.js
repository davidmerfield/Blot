var client = require("client");

module.exports = {
  set: function(blogID, folder, callback) {
    var multi = client.multi();
    multi.set("blog:" + blogID + ":local:folder", folder);
    multi.sadd("clients:local:blogs", blogID);
    multi.exec(callback);
  },
  get: function(blogID, callback) {
    client.get("blog:" + blogID + ":local:folder", callback);
  },
  list: function(callback) {
    client.smembers("clients:local:blogs", callback);
  },
  unset: function(blogID, callback) {
    var multi = client.multi();
    multi.del("blog:" + blogID + ":local:folder");
    multi.srem("clients:local:blogs", blogID);
    multi.exec(callback);
  }
};
