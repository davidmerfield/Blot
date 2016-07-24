var protocols = ['http:', 'https:'];
var Url = require('url');

function invalid (url) {

  var parsed;

  try {
    parsed = Url.parse(url);
  } catch (e) {
    return new Error('Could not parse ' + url);
  }

  if (!parsed.host || !parsed.protocol)
    return new Error('Has no host or protocol ' + url);

  if (protocols.indexOf(parsed.protocol) === -1)
    return new Error('Has unsupported protocol ' + url);

  return false;
}

module.exports = invalid;