const extractMetadata = require("build/metadata");
const localPath = require("helper/localPath");
const fs = require("fs-extra");

module.exports = function (blog, text) {
  if (!text) return;

  const pathToBib = extractMetadata(text).metadata.bibliography;

  if (!pathToBib) return;

  const fullPath = localPath(blog.id, pathToBib);

  if (!fs.existsSync(fullPath)) return;

  return fullPath;
};
