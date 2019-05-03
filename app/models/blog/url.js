module.exports = {
  css: function(cacheID) {
    return "/style.css?c=" + cacheID;
  },
  js: function(cacheID) {
    return "/script.js?c=" + cacheID;
  }
};
