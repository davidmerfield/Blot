var fs = require('fs-extra');
var ERR = 'Could not parse a valid date from stat.modified ';

module.exports = function(path, modified, callback) {

  var mtime;

  try {
    mtime = new Date(modified);
  } catch (e) {
    return callback(ERR + modified);
  }

  if (mtime === false ||
      mtime === null ||
      mtime === undefined ||
    !(mtime instanceof Date)  ) {
    return callback(ERR + modified);
  }

  fs.utimes(path, mtime, mtime, function(err){

    if (err) return callback(err);

    return callback(null);
  });
};