var fs = require("fs-extra");
var tempDir = require("path").resolve(__dirname + "/../../data/tmp/") + "/";

// Ensure tmp dir exists
fs.ensureDirSync(tempDir);

function insideTempDir (checkPath, callback) {
  if (checkPath && callback) {
    return fs.realpath(checkPath, function (err, resolvedPath) {
      if (resolvedPath === undefined)
        return callback("The path does not point to a file: " + checkPath);
      return callback(err, resolvedPath.indexOf(tempDir) === 0);
    });
  }

  return tempDir;
}

module.exports = insideTempDir;
