const fs = require("fs-extra");

module.exports = function setMtime(path, modified, callback) {
  var mtime;

  try {
    mtime = new Date(modified);
  } catch (e) {
    return callback(e);
  }

  if (
    mtime === false ||
    mtime === null ||
    mtime === undefined ||
    !(mtime instanceof Date)
  ) {
    return callback(new Error("Download: setMtime: Could not create date"));
  }

  fs.utimes(path, mtime, mtime, function (err) {
    if (err) return callback(err);

    return callback(null);
  });
};
