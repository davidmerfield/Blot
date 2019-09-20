var rootDir = require("./rootDir");
var joinpath = require("path").join;

function themeDir(name) {
  return joinpath(rootDir, "themes", name);
}

module.exports = themeDir;
