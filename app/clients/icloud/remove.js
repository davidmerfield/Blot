var debug = require("debug")("blot:clients:icloud:remove");

module.exports = function remove(blogID, path, callback) {
  debug("Blog:", blogID, "Removing", path);
  callback(null);
};
