var helper = require('../../helper');
var pathNormalize = helper.pathNormalizer;

module.exports = {

  nextEntryID: function (blogID) {
    return 'blog:' + blogID + ':next_entry_id';
  },

  url: function  (blogID, url) {
    return 'blog:' + blogID + ':url:' + url;
  },

  entry: function  (blogID, entryID) {
    return 'blog:' + blogID + ':entry:' + entryID;
  },

  path: function  (blogID, path) {
    return 'blog:' + blogID + ':path:' + pathNormalize(path);
  },

  search: function  (blogID) {
    return 'blog:' + blogID + ':search';
  }
};
