var { blog_folder_dir } = require("config");
var ensure = require("./ensure");
var resolve = require("path").resolve;
var join = require("path").join;
var pathNormalizer = require("helper/pathNormalizer");
// This takes a blog ID and a file
// path and returns the path to the file
// on the server.

module.exports = function (blogID, path) {
  ensure(blogID, "string").and(path, "string");

  if (!path) path = "/";

  path = pathNormalizer(path);

  const root = join(blog_folder_dir, blogID);

  // By resolving the user-supplied path against
  // the root of their blog folder we aim to prevent
  // producing a local path which is outside their folder
  path = resolve(root, path);
  path = join(root, path);

  return path;
};
