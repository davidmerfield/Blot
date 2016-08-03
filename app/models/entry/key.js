var helper = require('../../helper');
var pathNormalize = helper.pathNormalizer;

module.exports = {

  url: function  (blogID, url) {
    return 'blog:' + blogID + ':url:' + url;
  },

  entry: function  (blogID, path) {
    return 'blog:' + blogID + ':entry:' + pathNormalize(path);
  },

  search: function  (blogID) {
    return 'blog:' + blogID + ':search';
  }
};
