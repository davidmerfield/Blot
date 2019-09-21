var Url = require("url");
var UID = require("./makeUid");
var makeSlug = require("./makeSlug");

var basename = require("path").basename;
var extname = require("path").extname;

function nameFrom(src) {
  var name;

  try {
    name = basename(Url.parse(src).pathname);

    var ext = extname(name) || "";

    if (ext) {
      name = name.slice(0, -ext.length);
    }

    // First we remove all non word chars
    // perhaps makeslug should have this option?
    // For some reason, encoded utf-8 chars break
    // when linked to on cloudfront or s3, unsure why.
    // try uploading 'inpüt.jpg' to see what happens.
    name = name.replace(/[^\w\-\s\.]+/g, "");

    name = makeSlug(name) + ext;
    name = name.slice(-35);
  } catch (e) {}

  return name || UID(10);
}

var assert = require("assert");

function is(src, expected) {
  var output = nameFrom(src);

  try {
    assert(output === expected);
  } catch (e) {
    console.log("INPUT:", src);
    console.log("OUTPUT:", output);
    console.log("EXPECTED:", expected);
  }
}

is(
  "/foo0000000000000000000000000000000000000000.txt",
  "0000000000000000000000000000000.txt"
);

is("/foo.txt", "foo.txt");
is("/foo/bar.txt", "bar.txt");
is("bar.txt", "bar.txt");

is("//google.com/bar.txt", "bar.txt");
is("https://google.com/fOo-bAr.txt?baz=true&twit=false", "foo-bar.txt");

// is('http://google.com');

module.exports = nameFrom;
