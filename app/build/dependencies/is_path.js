var debug = require("debug")("build:dependencies:is_path");

// There don't seem to be many rules for paths...

function is_path(string) {
  if (!string || typeof string !== "string") {
    debug(string, "is not a valid string");
    return false;
  }

  return true;
}

module.exports = is_path;
