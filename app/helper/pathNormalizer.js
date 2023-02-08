const ensure = require("helper/ensure");

module.exports = function pathNormalizer(path) {
  ensure(path, "string");

  if (!path) return "";

  // Add leading slash
  if (!path.startsWith("/")) path = "/" + path;

  // Add trailing temporary slash
  if (!path.endsWith("/")) path = path + "/";

  // trim leading or trailing whitespace
  // after adding leading and trailing slash
  // to preserve folders or files with leading
  // or trailing whitespace
  path = path.trim();

  // remove double slashes
  path = path.split("//").join("/");

  // Remove trailing slash
  if (path.endsWith("/") && path !== "/") path = path.slice(0, -1);

  return path;
};
