var fs = require('fs');
var rimraf = require('rimraf');

var ensure = require('./ensure');
var notAllowed = require('./notAllowed');

var PERMISSION_ERROR = 'No permission to remove path: ';
var STATS_ERROR =  'No stat retrieved for: ';

function remove (path, callback) {

  callback = callback || function(err){if(err)throw err;};

  ensure(path, 'string')
    .and(callback, 'function');

  var stat = false;

  if (notAllowed(path))
    return callback(permError(path), stat);

  fs.lstat(path, function(err, stats){

    if (err && err.code === 'ENOENT')
      return callback(null, stat);

    if (err && err.code !== 'ENOENT')
      return callback(err, stat);

    if (!stats || stats.isDirectory === undefined)
      return callback(statError(path), stat);

    var remove = stats.isDirectory() ? rimraf : fs.unlink;

    remove(path, function(err){

      if (err && err.code === 'ENOENT')
        return callback(null, stat);

      if (err && err.code !== 'ENOENT')
        return callback(err, stat);

      callback(null, true);
    });
  });
}

function permError (path) {

  var err = new Error(PERMISSION_ERROR + path);
      err.code = 'EPERM';

  return err;
}

function statError (path) {

  var err = new Error(STATS_ERROR + path);
      err.code = 'ESTAT';

  return err;
}

module.exports = remove;