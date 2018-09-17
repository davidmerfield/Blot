var request = require('request');
var Url = require('url');
var config = require('config');
var cheerio = require('cheerio');

var PLAYER_OPTIONS = 'rel=0&wmode=transparent&rel=0&autohide=1&showinfo=0';

// we prepend a zero-width char because of a weird fucking
// bug on mobile safari where if the embed is the first child,
// the video player will not show.
function template (id, ratio) {
  return '<div style="width:0;height:0"> </div><div class="videoContainer" style="padding-bottom:' + ratio + '%"><iframe src="https://www.youtube.com/embed/' + id + '?' + PLAYER_OPTIONS + '" frameborder="0" allowfullscreen></iframe></div>';
}

function apiURL (id) {
  return 'https://www.googleapis.com/youtube/v3/videos?part=player&id=' + id + '&key=' + config.youtube.secret;
}

function fail () {
  return new Error('Could not parse youtube video');
}

function extractID (href) {

  var url = Url.parse(href, true);
  var id;

  if (url.host === 'youtu.be') {

    id = url.pathname.slice(1);

  } else {

    id = url.query.v;

  }

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

  request(options, function (error, response, body) {

    if (error || !body)
      return callback(fail());

    items = body.items;

    if (!body.items ||!body.items[0])
      return callback(fail());

    player = body.items[0].player;

    if (!player || !player.embedHtml)
      return callback(fail());

    try {

      var $ = cheerio.load(player.embedHtml);

      width = $('iframe').attr('width');
      height = $('iframe').attr('height');
      ratio = height / width * 100;

    } catch (e) {
      return callback(fail());
    }

    return callback(null, template(id, ratio));
  });
};