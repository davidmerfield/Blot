var ensure = require('./ensure');
var unorm = require('unorm');
var charNormalize = unorm.nfc;

// takes URL, adds leading slash, removes trailing slash;

function pathNormalizer (path) {

  ensure(path, 'string');

  if (!path) return '';

  // Map '%20' to a space etc..
  path = decodeURIComponent(path);

  // Not sure exactly what this does
  path = charNormalize(path);

  path = path.trim().toLowerCase();

  path = path.split('//').join('/');

  // Remove trailing slash
  if (path.charAt(path.length -1) === '/') path = path.slice(0, -1);

  // Add leading slash
  if (path.charAt(0) !== '/') path = '/' + path;

  return path;
}

(function tests(){

  var assert = require('assert');

  function is (path, expected) {
    assert.deepEqual(pathNormalizer(path), expected);
  }

  is('BaR', '/bar');
  is('/foo/bar/', '/foo/bar');
  is('foo/bar/', '/foo/bar');
  is('//foo/bar/', '/foo/bar');
  is('foo/bar/bam.txt', '/foo/bar/bam.txt');
  is('FOO/ba r/b am .txt', '/foo/ba r/b am .txt');
}());

module.exports = pathNormalizer;