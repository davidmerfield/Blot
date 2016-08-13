var rootDir = require('./rootDir');
var joinpath = require('path').join;

function themeDir (name) {
  return joinpath(rootDir, 'templates', name);
};

module.exports = themeDir;