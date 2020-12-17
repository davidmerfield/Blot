var request = require("request");
var cheerio = require("cheerio");
var url = require("url");

// we prepend a zero-width char because of a weird fucking
// bug on mobile safari where if the embed is the first child,
// the video player will not show. This causes issues with
// inline elements displaying (adds extra space) solution needed
// that doesn't disrupt page layout...
function template(url, width, height) {
  return (
    '<div style="width:0;height:0"> </div><div class="videoContainer bandcamp" style="padding-bottom: ' +
    height +
    'px"><iframe width="' +
    width +
    '" height="' +
    height +
    '" src="' +
    encodeURI(url) + // encodeURI should prevent a passed URI from escaping / causing an XSS
    '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>'
  );
}

var FAIL = "Could not retrieve song properties";

module.exports = function (href, callback) {
  // Before loading anything, check that the path starts with
  // /album or /track
  var path, paths;
  try {
    path = url.parse(href).pathname;
  } catch (e) {
    return callback(new Error(FAIL));
  }

  // Trim trailing slash if applicable
  if (path.slice(-1) === "/") path = path.slice(0, -1);

  paths = path.split("/");

  if (paths.length < 1) {
    return callback(new Error(FAIL));
  }

  var category = paths[1];
  if (category !== "track" && category !== "album") {
    return callback(new Error(FAIL));
  }

  request(href, function (error, response, body) {
    if (error) return callback(error);

    var $, height, width, html;

    try {
      $ = cheerio.load(body);
      width = Number($('meta[property="og:video:width"]').attr("content"));
      height = Number($('meta[property="og:video:height"]').attr("content"));
      html = $('meta[property="og:video"]').attr("content");
    } catch (error) {
      return callback(new Error(FAIL));
    }

    if (!html || isNaN(height) || isNaN(width)) {
      return callback(new Error(FAIL));
    }

    return callback(null, template(html, width, height));
  });
};
