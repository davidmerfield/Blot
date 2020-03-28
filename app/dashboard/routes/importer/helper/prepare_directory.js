var fs = require("fs");

module.exports = function(output_directory, callback) {
  fs.emptyDir(output_directory, callback);
};
