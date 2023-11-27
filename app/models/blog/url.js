module.exports = {
  css: (cacheID) => `/style.css?cache=${cacheID}&amp;extension=.css`,
  js: (cacheID) => `/script.js?cache=${cacheID}&amp;extension=.js`,
};
