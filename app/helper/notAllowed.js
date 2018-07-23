var config = require('../../config');
var ensure = require('./ensure');
var fs = require('fs');
var homeDir = fs.realpathSync(__dirname + '/../../');

var allowedDirs = [
  homeDir + '/data/'
];

function notAllowed (path) {

  ensure(path, 'string');

  var verboten = true;

  for (var i in allowedDirs) {

    var allowedDir = allowedDirs[i];

    if (path.indexOf(allowedDir) === 0 &&
        path.length > allowedDir.length) {
      verboten = false;
      break;
    }
  }

  return verboten;
}

function tests () {

  var assert = require('assert');

  var testList = {
    '/Users/David/Projects/blot/blogs/': true,
    '/Users/David/': true,
    '/Users/David/Projects/blot/blogs/foo': true,
    '/': true,
    '*': true,

    '/Users/David/Projects/blot/data/blogs/foo': false,
    '/Users/David/Projects/blot/data/blogs/foo/bar/baz.txt': false,
    '/Users/David/Projects/blot/data/blogs/foo.txt': false,
    '/Users/David/Projects/blot/data/tmp/foo': false,
    '/Users/David/Projects/blot/data/tests/foo': false
  };

  for (var i in testList) {
    assert(notAllowed(i) === testList[i]);
  }
}

if (config.environment === 'development') tests();

module.exports = notAllowed;