var extractMetadata = require("../../metadata");
var localPath = require("helper").localPath;

module.exports = function(blog, text) {
  var pathToBib = extractMetadata(text).metadata.bibliography;

  if (!text || !pathToBib) return;

  console.log(require('fs').readFileSync(localPath(blog.id, pathToBib)));
  
  return localPath(blog.id, pathToBib);
};
