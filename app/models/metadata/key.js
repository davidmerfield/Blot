const pathNormalizer = require("helper/pathNormalizer");

module.exports = {
  all: function (blogID) {
    return "blog:" + blogID + ":folder:everything";
  },

  path: function (blogID, path) {
    return "blog:" + blogID + ":folder:" + pathNormalizer(path);
  },
};
