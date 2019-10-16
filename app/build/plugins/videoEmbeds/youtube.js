var request = require("request");
var Url = require("url");
var config = require("config");
var cheerio = require("cheerio");

var PLAYER_OPTIONS = "rel=0&wmode=transparent&rel=0&autohide=1&showinfo=0";

// we prepend a zero-width char because of a weird fucking
// bug on mobile safari where if the embed is the first child,
// the video player will not show.
function template(id, ratio) {
  return (
    '<div style="width:0;height:0"> </div><div class="videoContainer" style="padding-bottom:' +
    ratio +
    '%"><iframe src="https://www.youtube-nocookie.com/embed/' +
    id +
    "?" +
    PLAYER_OPTIONS +
    '" frameborder="0" allowfullscreen></iframe></div>'
  );
}

function apiURL(id) {
  return (
    "https://www.googleapis.com/youtube/v3/videos?part=player&id=" +
    id +
    "&key=" +
    config.youtube.secret
  );
}

function fail() {
  return new Error("Could not parse youtube video");
}

function extractID(href) {
  var url = Url.parse(href, true);
  var id;
  if (url.host === "youtu.be") {
    id = url.pathname.slice(1);
  } else {
    id = url.query.v;
  }

  // Url.parse maps backslashes (used to escape) to forward
  // slashes, e.g. '/_' for some reason. We remove the forward
  // slash here, since it breaks video embeds for videos with
  // ids that contain escapable characters, e.g.
  // https://youtu.be/6orc\_lHvJKY
  id = id.split("/").join("");

  return id;
}

module.exports = function(href, callback) {
  var id, width, height, ratio, items, player;

  try {
    id = extractID(href);
  } catch (e) {
    return callback(fail());
  }

  if (!id) return callback(fail());

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
    try {
      var $ = cheerio.load(body.items[0].player.embedHtml);

      width = $("iframe").attr("width");
      height = $("iframe").attr("height");
      ratio = (height / width) * 100;
    } catch (e) {
      // Fallback to default Youtube player ratio if API
      // request fails or shape of data returned changes
      ratio = 56.5;
    }

    return callback(null, template(id, ratio));
  });
};
