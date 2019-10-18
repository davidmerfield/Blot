var ensure = require("./ensure");
var Url = require("url");

// takes URL path, adds leading slash, removes trailing slash;

function urlNormalizer(url) {
  ensure(url, "string");

  if (!url) return "";

  try {
    url = Url.parse(url).pathname;
  } catch (e) {
    return "";
  }

  if (url.slice(0, 1) !== "/") url = "/" + url;

  if (url.slice(-1) === "/" && url.length > 1) url = url.slice(0, -1);

  url = url.split("//").join("/");

  return url.toLowerCase();
}

var is = require("./is")(urlNormalizer);

is("", "");
is("/", "/");
is("//", "/");
is("/fo/", "/fo");
is("http://blot.im/foo/bar", "/foo/bar");
is("/foo/bar/", "/foo/bar");
is("foo/bar/", "/foo/bar");

module.exports = urlNormalizer;
