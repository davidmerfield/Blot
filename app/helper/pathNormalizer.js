var ensure = require('./ensure');
var unorm = require('unorm');
var charNormalize = unorm.nfc;

// takes URL, adds leading slash, removes trailing slash;
var Is = require('./is');

function pathNormalizer (path) {

  ensure(path, 'string');

  if (!path) return '';

  try {
    // Map '%20' to a space etc..
    path = decodeURIComponent(path);
  } catch (e) {
    console.log('Warning: could not call decodeURIComponent on the path "' + path + '"');
    console.log(e);
  }

  try {
    // Not sure exactly what this does
    path = charNormalize(path);
  } catch (e) {
    console.log('Warning: could not call unorm.nfc on the path "' + path + '"');
    console.log(e);
  }

  // Not sure exactly what this does

  path = path.trim().toLowerCase();

  path = path.split('//').join('/');

  // Remove trailing slash
  if (path.charAt(path.length -1) === '/') path = path.slice(0, -1);

  // Add leading slash
  if (path.charAt(0) !== '/') path = '/' + path;

  return path;
}

var is = Is(pathNormalizer);

// Sanity
is('/', '/');
is('/foo', '/foo');
is('/foo/bar', '/foo/bar');

// Trim leading or trailing whitespace
is(' / ', '/');

// Preserve internal whitespace
is('/a b c', '/a b c');

// Remove trailing slash
is('/foo/', '/foo');

// Add leading slash
is('foo', '/foo');

// Lowercase
is('/BaR', '/bar');

// Replace double slashes with single slashes
is('//foo//bar//', '/foo/bar');

// Preserve non alphanum characters
is('/←→', '/←→');
is('使/用/百/度/馈/', '/使/用/百/度/馈');

// Preserve url encoding
is('/%20a%20b', '/%20a%20b');

module.exports = pathNormalizer;