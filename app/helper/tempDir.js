var path = require('path');
var fs = require('fs-extra');
var tempDir = __dirname + '/../../data/tmp/';

fs.ensureDirSync(tempDir);

function insideTempDir (checkPath, callback) {

  if (checkPath && callback) {
    return fs.realpath(checkPath, function (err, resolvedPath) {
      if (resolvedPath === undefined)
        return callback('The path does not point to a file: ' + checkPath);
      return callback(err, resolvedPath.indexOf(tempDir) === 0);
    });
  }

  return tempDir;
}

module.exports = insideTempDir;

function unitTests() {

  var assert = require('assert');

  insideTempDir(__dirname, function(err, isInTempDir){
    assert.deepEqual(isInTempDir, false);
  });

  insideTempDir(__dirname + '/foo.jpg', function(err, isInTempDir){
    assert.deepEqual(isInTempDir, undefined);
  });

  var validDir = tempDir + 'foo';

  fs.mkdir(validDir, function(err, stat){

    if (err) throw err;

    insideTempDir(validDir, function(err, isInTempDir){

      if (err) throw err;

      assert.deepEqual(isInTempDir, true);

      fs.rmdir(validDir, function(err, stat){

        if (err) throw err;
      });
    });
  });
}