var Plugins = require('../../../models/entry/build/plugins');

module.exports = function (req, callback) {
  Plugins.load('js', req.blog.plugins, callback);
};