function isHidden(path) {
  var hidden = false;

  var dirs = path.split("/");

  for (var i in dirs)
    if (dirs[i][0] === "_" || dirs[i][0] === ".") hidden = true;

  return hidden;
}

var assert = require("assert");

function is(path, expected) {
  assert(isHidden(path) === expected);
}

is("/foo/-bar", false);
is("/foo/b-a-r/baz", false);

is("/foo/_bar/baz", true);
is("/foo/_bar/b_az/_bar", true);
is("_bar", true);
is("/foo/.cache/baz", true);

module.exports = isHidden;
