var ensure = require("helper/ensure");
var makeSlug = require("helper/makeSlug");

module.exports = function withoutExtension(path) {
  // Takes a path, return the path with the file extension
  ensure(path, "string");

  if (!path) return "";

  var names = path.split("/");

  names[names.length - 1] = strip(names[names.length - 1]);

  path = names.join("/");

  return path;
};

function strip(name) {
  if (name.indexOf(".") > -1) {
    var remainder = name.slice(name.lastIndexOf(".") + 1).toLowerCase();

    if (remainder && makeSlug(remainder) === remainder)
      name = name.slice(0, name.lastIndexOf("."));
  }

  return name;
}
