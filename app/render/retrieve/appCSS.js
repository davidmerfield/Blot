var Plugins = require('../../plugins');

module.exports = function (req, callback) {
  Plugins.load('css', req.blog.plugins, callback);
};