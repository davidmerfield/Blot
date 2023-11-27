var Blog = require("models/blog");
var debug = require("debug")("blot:clients:local:disconnect");

// Removes the record which tells Blot that a given blog
// is synced from a local source folder. When the server
// starts, Blot will no longer watch that folder.
module.exports = function disconnect(blogID, callback) {
  debug("Blog", blogID, "Disconnecting local client");
  Blog.set(blogID, { client: "" }, callback);
};
