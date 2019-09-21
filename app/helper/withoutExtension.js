var ensure = require("./ensure");
var makeSlug = require("./makeSlug");

// Takes a path, return the path with the file extension
function withoutExtension(path) {
  ensure(path, "string");

  if (!path) return "";

  var names = path.split("/");

  names[names.length - 1] = strip(names[names.length - 1]);

  path = names.join("/");

  return path;
}

function strip(name) {
  if (name.indexOf(".") > -1) {
    var remainder = name.slice(name.lastIndexOf(".") + 1).toLowerCase();

    if (remainder && makeSlug(remainder) === remainder)
      name = name.slice(0, name.lastIndexOf("."));
  }

  return name;
}

var is = require("./is")(withoutExtension);

is("", "");
is("bar.txt", "bar");
is("foo", "foo");
is("Foo.bar.baz", "Foo.bar");
is("/foo/bar/baz.txt", "/foo/bar/baz");
is("/foo/bar.foo.txt", "/foo/bar.foo");
is("foo.bar/bar.baz", "foo.bar/bar");
module.exports = withoutExtension;
