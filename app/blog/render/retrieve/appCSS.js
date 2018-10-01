var Plugins = require('../../../sync/update/build/plugins');

module.exports = function (req, callback) {
  Plugins.load('css', req.blog.plugins, callback);
};