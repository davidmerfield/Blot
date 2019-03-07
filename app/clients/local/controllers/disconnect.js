var Folder = require("../models/folder");
var Blog = require("blog");
var debug = require("debug")("blot:clients:local:disconnect");

// Removes the record which tells Blot that a given blog
// is synced from a local source folder. When the server
// starts, Blot will no longer watch that folder.
module.exports = function disconnect(blogID, callback) {
  debug("Blog", blogID, "Disconnecting local client");

  Folder.unset(blogID, function(err) {
    if (err) return callback(err);
    // Right now it is neccessary to set the client
    // property of the blog to an empty string. Eventually
    // clients should not need to do this.
    Blog.set(blogID, { client: "" }, callback);
  });
};
