var protocols = ['http:', 'https:'];
var Url = require('url');

function isURL (url) {

  if (!url) return false;

  if (url.indexOf('//') === 0)
    url = 'http:' + url;

  var parsed;

  try {
    parsed = Url.parse(url);
  } catch (e) {
    return false;
  }

  if (!parsed.host || !parsed.protocol)
    return false;

  if (protocols.indexOf(parsed.protocol) === -1)
    return false;

  return url;
}

module.exports = isURL;