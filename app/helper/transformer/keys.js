var ensure = require('../ensure');
var hash = require('../hash');

module.exports = function(blogID, name) {

  ensure(blogID, 'string')
    .and(name, 'string');

  var prefix = 'blog:' + blogID + ':store:' + name;

  return {

    everything: prefix + ':' + 'everything',

    // store the result against a content hash
    content: function (contentHash) {
      ensure(contentHash, 'string');
      return prefix + ':content:' + contentHash;
    },

    url: {

      // store the latest response headers against hash of url string
      headers: function (url) {
        ensure(url, 'string');
        return prefix + ':url:headers:' + hash(url);
      },

      // store the latest content hash against hash of url string
      content: function(url) {
        ensure(url, 'string');
        return prefix + ':url:content:' + hash(url);
      }
    }
  };
};