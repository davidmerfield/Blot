var Url = require("url");
var debug = require("debug")("blot:build:dependencies:is_url");

function is_url(string) {
  var url;

  if (!string) {
    debug(string, "is falsy");
    return false;
  }

  if (typeof string !== "string") {
    debug(string, "is not a string");
    return false;
  }

  // Prepend protocol automatically for next part
  // It's unimportant that the protocol is HTTP as
  // opposed to HTTPS since we don't modify it in
  // any way, we're just checking if it's a URL.
  if (string.indexOf("//") === 0) {
    string = "http:" + string;
  }

  try {
    url = Url.parse(string);
  } catch (e) {
    debug(string, "could not be parsed");
    return false;
  }

  if (!url || !url.href || !url.host || !url.protocol) {
    debug(string, "lacks properties of URLs");
    return false;
  }

  debug(string, "is a valid URL!");
  return true;
}

module.exports = is_url;
