var helper = require('../helper');
var ensure = helper.ensure;

// takes URL, adds leading slash, removes trailing slash;
function normalize (url) {

  ensure(url, 'string');

  if (!url) return '';

  if (url.slice(-1) === '/')
    url = url.slice(0, -1);
      
  if (!url) return '';

  return url.toLowerCase();
};
  

(function tests(){

  var assert = require('assert');

  function is (url, expected) {
    assert.deepEqual(normalize(url), expected);
  }

  is('http://blot.im/foo/bar', 'http://blot.im/foo/bar');
  is('http://blot.im/foo/bar/', 'http://blot.im/foo/bar');
  is('http://blot.im/FoO/bAr/', 'http://blot.im/foo/bar');

}());

module.exports = normalize;