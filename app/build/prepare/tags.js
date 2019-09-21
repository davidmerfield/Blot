var helper = require("helper");
var type = helper.type;
var ensure = helper.ensure;
var _ = require("lodash");

// This is used to turn a file path into
// an array of tags for an entry
function extractTags(filePath, initial) {
  if (!type(initial, "array")) {
    initial = [];
  }

  var opener = "[";
  var closer = "]";

  ensure(filePath, "string")
    .and(opener, "string")
    .and(closer, "string");

  var tags = initial || [];

  filePath.split("/").forEach(function fromDir(dir) {
    var openerIndex = dir.indexOf(opener);
    var closerIndex = dir.indexOf(closer);

    // Happens when the opener and closer are the same
    if (closerIndex === openerIndex && opener === closer && openerIndex !== -1)
      closerIndex =
        openerIndex +
        opener.length +
        dir.slice(openerIndex + opener.length).indexOf(closer);

    if (openerIndex === -1 || closerIndex === -1) return;

    if (closerIndex < openerIndex) return;

    var tag = dir.slice(openerIndex + opener.length, closerIndex);

    tags.push(tag);

    dir = dir.slice(closerIndex + closer.length);

    if (dir) fromDir(dir);
  });

  return _.uniq(tags);
}

(function tests() {
  var assert = require("assert");

  function is(filePath, expected, opener, closer) {
    try {
      assert.deepEqual(extractTags(filePath, opener, closer), expected);
    } catch (e) {
      console.log("------ input ------");
      console.log(filePath);
      console.log("----- became ------");
      console.log(extractTags(filePath, opener, closer));
      console.log("---- instead of ---");
      console.log(expected);
      throw "";
    }
  }

  // is('/{foo}/{bar}}', ['foo', 'bar'], '{', '}');

  is("", []);
  is("/", []);
  is("/foo/bar/baz", []);
  is("[a]", ["a"]);
  is("[foo]", ["foo"]);
  is("[foo]/bar/baz", ["foo"]);
  is("/[foo]/bar/baz", ["foo"]);
  is("/[foo] [bar]/bar/baz", ["foo", "bar"]);
  is("/[foo]/[bar]/[baz]", ["foo", "bar", "baz"]);
  is("/[foo] [bar]/[bar] [baz]/[bat] [bam", ["foo", "bar", "baz", "bat"]);
  is("/[Foo] [bar Man]/[count /[bAt]", ["Foo", "bar Man", "bAt"]);

  // Custom closers
  // is('/{{foo}}/{{bar}}', ['foo', 'bar'], '{{', '}}');
  // is('/--foo--/{{bar}}', ['foo'], '--', '--');
})();

module.exports = extractTags;
