var crypto = require('crypto');
var prefix = 'cache:';

module.exports = {

  // String containing the content to cache
  content: function (fullUrl) {
    return prefix + 'content:' + hash(fullUrl);
  },

  // String containing the content type of a URL
  type: function (fullUrl) {
    return prefix + 'type:' + hash(fullUrl);
  },

  // Set containing all the keys for a user
  // Used so a user's cache can be flushed...
  blog: function (blogID) {
    return prefix + blogID + ':all';
  },

  // Set containg every single cached key
  // Used so the site's entire cache can be flushed
  all: function() {
    return prefix + 'all';
  }
};

function hash (string) {
  return crypto.createHash('md5').update(string).digest("hex");
}