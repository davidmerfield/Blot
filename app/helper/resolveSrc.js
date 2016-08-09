var resolve = require('path').resolve;
var Url = require('url');

function resolveSrc (src, folder) {

  if (!src) return src;

  // We only want to resolve paths
  if (isURL(src)) return src;

  // ... and they must not be absolute
  if (src[0] === '/') return src;

  if (!folder) return src;

  // Add leading slash to folder if it doesn
  // exist. Otherwise path.resolve somehow
  // involves __dirname in the thing
  if (folder[0] !== '/')
    folder = '/' + folder;

  try {
    src = resolve(folder, src);
  } catch (e){}

  return src;
}

var is = require('./is')(resolveSrc);

// Empties
is('', '', '');
is('', '/foo', '');
is('foo.jpg', '', 'foo.jpg');

// Resolve relative paths
is('foo.jpg', '/bar', '/bar/foo.jpg');
is('../foo.jpg', '/bat', '/foo.jpg');
is('./foo.jpg', 'bar/baz', '/bar/baz/foo.jpg');

// Don't mess with absolute paths
is('//bar.jpg', '/foo', '//bar.jpg');
is('/bar.jpg', '/foo/bar', '/bar.jpg');

// Preserve urls
is('//foo.com/bar.jpg', '/bat', '//foo.com/bar.jpg');
is('https://foo.com/bar.jpg', '/bat', 'https://foo.com/bar.jpg');
is('http://foo.com/bar.jpg', '/bat', 'http://foo.com/bar.jpg');

function isURL (src) {

  var url;

  // prepend protocol automatically for next part
  if (src.indexOf('//') === 0) src = 'http:' + src;

  try {
    url = Url.parse(src);
  } catch (e) {
    return false;
  }

  if (!url || !url.href || !url.host || !url.protocol)
    return false;

  return true;
}

module.exports = resolveSrc;