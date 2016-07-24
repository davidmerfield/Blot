var fs = require('fs');
var mkdirp = require('./mkdirp');

var ensure = require('./ensure');
var notAllowed = require('./notAllowed');

var PERMISSION_ERROR = 'No permission to remove path: ';

function renameFile (from, to, callback) {

  ensure(from, 'string')
    .and(to, 'string')
    .and(callback, 'function');

  var stat = false;

  if (notAllowed(from))
    return callback(permError(from), stat);

  if (notAllowed(to))
    return callback(permError(to), stat);

  var parentTo = to.slice(0, to.lastIndexOf('/'));

  mkdirp(parentTo, function(err){

    if (err) return callback(err);

    fs.rename(from, to, function(err){

      if (err) return callback(err, stat);

      callback(err, true);
    });
  });
}

function permError (path) {

  var err = new Error(PERMISSION_ERROR + path);
      err.code = 'EPERM';

  return err;
}


module.exports = renameFile;