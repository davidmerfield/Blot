var blogDir = require("./blogDir");
var ensure = require("./ensure");
var normalize = require("./pathNormalizer");
var joinPath = require("path").join;

// This takes a blog ID and a file
// path and returns the path to the file
// on the server.

module.exports = function(blogID, path) {
  ensure(blogID, "string").and(path, "string");

  if (!path) return "";

  path = path.trim();

  path = path.split("//").join("/");

  // Remove trailing slash
  if (path.slice(-1) === "/") path = path.slice(0, -1);

  // Add leading slash
  if (path[0] !== "/") path = "/" + path;

  return joinPath(blogDir, blogID, 'folder', path);
};
