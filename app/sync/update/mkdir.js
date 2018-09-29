var Metadata = require("metadata");

module.exports = function(blogID, path, options, callback) {

  if (options.name) {
    Metadata.add(blogID, path, options.name, callback);
  } else {
    callback(null);
  }
};
