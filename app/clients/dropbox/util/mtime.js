var helper = require("helper");
var ensure = helper.ensure;

var fs = require("fs");
var ERR = "Could not parse a valid date from stat.modified ";

module.exports = function(path, modified, callback) {
  ensure(path, "string")
    .and(modified, "string")
    .and(callback, "function");

  var mtime;

  try {
    mtime = new Date(modified);
  } catch (e) {
    return callback(ERR + modified);
  }

  if (
    mtime === false ||
    mtime === null ||
    mtime === undefined ||
    !(mtime instanceof Date)
  ) {
    return callback(ERR + modified);
  }

  fs.utimes(path, mtime, mtime, callback);
};
