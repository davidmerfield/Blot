var fs = require("fs-extra");
var rootDir = require("./rootDir");
var blogDir = rootDir + "/data/blogs";

try {
  fs.ensureDirSync(blogDir);
} catch (e) {
  if (e.code !== "EEXIST") throw e;
}

module.exports = blogDir;
