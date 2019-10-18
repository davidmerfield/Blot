var dirname = require("path").dirname;
var resolve_path = require("path").resolve;
var debug = require("debug")("build:dependencies:resolve");

function resolve(path, value) {
  if (!path || !value) return value;

  if (typeof path !== "string") {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  var folder = dirname(path);

  if (!value) {
    debug(path, value, "is null");
    return value;
  }

  // ... and they must not be absolute
  if (value[0] === "/") {
    debug(path, value, "is absolute");
    return value;
  }

  if (!folder) {
    debug(path, value, "has no folder");
    return value;
  }

  // Add leading slash to folder if it doesn
  // exist. Otherwise path.resolve somehow
  // involves __dirname in the thing
  if (folder[0] !== "/") {
    debug(path, value, "adding leading slash to folder", folder);
    folder = "/" + folder;
  }

  try {
    value = resolve_path(folder, value);
  } catch (e) {
    // leaves src as is
  }

  debug(path, value, "resolved value");
  return value;
}

module.exports = resolve;
