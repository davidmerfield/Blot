var Plugins = require("build/plugins");

module.exports = function (req, callback) {
  Plugins.load("css", req.blog.plugins, callback);
};
