var fs = require("fs");
var rootDir = require("./rootDir");
var blogDir = rootDir + "/blogs";

try {
  fs.mkdirSync(blogDir);
} catch (e) {
  if (e.code !== "EEXIST") throw e;
}

module.exports = blogDir;
