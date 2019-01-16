var config = require('../../config');
var ensure = require('./ensure');
var fs = require('fs');
var homeDir = require('os').homedir();
var blotDir = process.env.BLOT_DIRECTORY;

var allowedDirs = [
  blotDir + '/blogs/',
  blotDir + '/tmp/',
  blotDir + '/tests/'
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
  var dir = process.env.BLOT_DIRECTORY;
  var testList = {};

  testList[`${blotDir}/blogs/`]    = true;
  testList[homeDir]            = true;
  // Is overriden overridden by one below
  // testList[`${blotDir}/blogs/foo`] = true;
  testList['/']                = true;
  testList['*']                = true;

  testList[`${dir}/blogs/foo`]             = false;
  testList[`${blotDir}/blogs/foo/bar/baz.txt`] = false;
  testList[`${blotDir}/blogs/foo.txt`]         = false;
  testList[`${blotDir}/tmp/foo`]               = false;
  testList[`${blotDir}/tests/foo`]             = false;

  for (var i in testList) {
    assert(notAllowed(i) === testList[i]);
  }
}

if (config.environment === 'development') tests();

module.exports = notAllowed;
