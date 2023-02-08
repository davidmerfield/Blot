var ensure = require("helper/ensure");

module.exports = function pathNormalizer(path) {
  ensure(path, "string");

  if (!path) return "";

  // trim leading or trailing whitespace
  path = path.trim();

  // remove double slashes
  path = path.split("//").join("/");

  // Remove trailing slash
  if (path.slice(-1) === "/") path = path.slice(0, -1);

  // Add leading slash
  if (path[0] !== "/") path = "/" + path;

  // trim leading or trailing whitespace
  path = path.trim();

  return path;
};
