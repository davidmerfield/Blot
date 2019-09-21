var request = require("request");
var basename = require("path").basename;

// we prepend a zero-width char because of a weird fucking
// bug on mobile safari where if the embed is the first child,
// the video player will not show. This causes issues with
// inline elements displaying (adds extra space) solution needed
// that doesn't disrupt page layout...
function template(id, ratio) {
  return (
    '<div style="width:0;height:0"> </div><div class="videoContainer vimeo" style="padding-bottom: ' +
    ratio +
    '%"><iframe src="//player.vimeo.com/video/' +
    id +
    '?badge=0&color=ffffff&byline=0&portrait=0" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>'
  );
}

function apiURL(id) {
  return "https://vimeo.com/api/v2/video/" + id + ".json";
}

var FAIL = "Could not retrieve video properties";

module.exports = function(href, callback) {
  var id, height, width, ratio, el;

  try {
    // we trim because without it,
    // some text editors fuck up.
    id = basename(href).trim();
  } catch (e) {
    return callback(new Error(FAIL));
  }

  // The request module has a known bug
  // which leaks memory and event emitters
  // during redirects. We cap the maximum
  // redirects to 5 to avoid encountering
  // errors when it creates 10+ emitters
  // for a URL with 10+ redirects...
  var options = {
    url: apiURL(id),
    json: true,
    maxRedirects: 5
  };

  request(options, function(error, response, body) {
    if (error || !body) return callback(new Error(FAIL));

    el = body[0];

    if (!el || !el.width || !el.height) return callback(new Error(FAIL));

    height = el.height;
    width = el.width;
    ratio = (height / width) * 100;

    return callback(null, template(id, ratio));
  });
};
