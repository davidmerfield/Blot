var parse = require("url").parse;
var ensure = require("./ensure");

function resolveURL(url, base) {
  ensure(url, "string").and(base, "string");

  var parsedURL;

  if (!url || !base) return false;

  url = url.trim();
  base = base.trim();

  // Trim trailing slashes
  while (base.slice(-1) === "/") base = base.slice(0, -1);

  // Resolve local image URLs
  // will turn /public/test.png
  // into david.blot.im/public/test.png
  if (url.charAt(0) === "/" && url.charAt(1) !== "/") {
    url = base + url;
  }

  // turn //cdn.example.com/image.png
  // into http://cdn.example.com/image.png
  if (url.charAt(0) === "/" && url.charAt(1) === "/") {
    url = "http:" + url;
  }

  try {
    parsedURL = parse(url);
  } catch (e) {
    return false;
  }

  if (!parsedURL.host && !parsedURL.protocol) {
    url = base + "/" + url;
    try {
      parsedURL = parse(url);
    } catch (e) {
      return false;
    }
  }

  if (!parsedURL.host && !parsedURL.protocol) {
    return false;
  }

  if (
    parsedURL.protocol !== "http" &&
    parsedURL.protocol !== "https" &&
    parsedURL.protocol !== "https:" &&
    parsedURL.protocol !== "http:"
  ) {
    return false;
  }

  return url;
}

// tests();

function tests() {
  var assert = require("assert");
  var base = "http://david.blot.im/";

  function res(url, expected, _base) {
    var output = resolveURL(url, _base || base);

    try {
      assert(output === expected);
    } catch (e) {
      console.log("ERROR");
      console.log("INPUT    >>", url);
      console.log("EXPECTED >>", expected);
      console.log("OUTPUT   >>", output);
      throw "Test failed :(";
    }
  }

  res("//cdn.example.com/image.png", "http://cdn.example.com/image.png");

  res("/image.png", base + "image.png");

  res("image.png", base + "image.png");

  res("http://i.imgur.com/2GybVZX.jpg", "http://i.imgur.com/2GybVZX.jpg");

  res("https://i.imgur.com/2GybVZX.jpg", "https://i.imgur.com/2GybVZX.jpg");

  res("image.png", "http://david.blot.im/image.png", "http://david.blot.im");

  res("/image.png", "http://david.blot.im/image.png", "http://david.blot.im");

  console.log("All tests passed");
}

module.exports = resolveURL;
