var helper = require("../../helper");
var ensure = helper.ensure;
var normalize = helper.pathNormalizer;

var dir = "/templates";

function slug(path) {
  path = normalize(path);

  if (path.slice(0, dir.length) !== dir) return false;

  path = path.slice(dir.length);

  path = path.split("/");

  if (!path.length || path.length < 2) return false;

  return path[1];
}

(function tests() {
  var assert = require("assert");

  assert(slug("/templates/foo") === "foo");
  assert(slug("/templates/FoO") === "foo");
  assert(slug("/TeMplates/FoO") === "foo");
  assert(slug("/TeMplates/FoO/bar/baz") === "foo");
  assert(slug("/TeMplates/") === false);
  assert(slug("/TeMplaes/") === false);
})();

module.exports = slug;
