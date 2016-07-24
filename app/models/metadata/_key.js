var helper = require('../../helper');
var normalize = helper.pathNormalizer;

// Verify this

module.exports = {
  path: function (blogID, path) {
    return 'blog:' + blogID + ':folder:' + normalize(path);
  },
  everything: function(blogID) {
    return 'blog:' + blogID + ':folder:everything';
  }
};