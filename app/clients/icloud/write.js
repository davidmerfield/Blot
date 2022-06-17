var debug = require("debug")("blot:clients:icloud:write");

module.exports = function remove(blogID, path, contents, callback) {
  debug("Blog:", blogID, "Write", path);
  callback(null);
};
