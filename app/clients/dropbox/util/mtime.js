var fs = require("fs-extra");

module.exports = function(path, modified, callback) {
  var mtime;

  try {
    mtime = new Date(modified);
  } catch (e) {
    return callback(
      new Error("Could not parse a valid date from stat.modified " + modified)
    );
  }

  fs.utimes(path, mtime, mtime, callback);
};
