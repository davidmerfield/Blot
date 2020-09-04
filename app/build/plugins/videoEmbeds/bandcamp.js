var metafetch = require("metafetch");
var url = require("url");

// we prepend a zero-width char because of a weird fucking
// bug on mobile safari where if the embed is the first child,
// the video player will not show. This causes issues with
// inline elements displaying (adds extra space) solution needed
// that doesn't disrupt page layout...
function template(url, width, height, ratio) {
  return (
    '<div style="width:0;height:0"> </div><div class="videoContainer bandcamp" style="padding-bottom: ' +
    ratio +
    '%"><iframe width="' +
    width +
    '" height="' +
    height +
    '" src="' +
    url +
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
    return next();
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

  var height, width, ratio;

  metafetch.fetch(href, function (error, data) {
    if (error || !data) return callback(new Error(FAIL));

    var meta = data.meta;
    height = Number(meta["og:video:height"]);
    width = Number(meta["og:video:width"]);
    html = meta["og:video"];

    if (height == NaN || width == NaN) {
      return callback(new Error(FAIL));
    }

    ratio = (height / width) * 100;

    return callback(null, template(html, width, height, ratio));
  });
};
