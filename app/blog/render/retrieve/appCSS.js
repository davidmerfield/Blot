var Plugins = require('../../../models/entry/build/plugins');

module.exports = function (req, callback) {
  Plugins.load('css', req.blog.plugins, callback);
};