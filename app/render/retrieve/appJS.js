var Plugins = require('../../plugins');

module.exports = function (req, callback) {
  Plugins.load('js', req.blog.plugins, callback);
};